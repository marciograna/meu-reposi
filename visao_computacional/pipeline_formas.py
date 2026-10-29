"""
Parte 2 - Protótipo de sistema de visão para classificação de formas.

Pipeline:
  Etapa 1: escala de cinza + filtro gaussiano 5x5
  Etapa 2: binarização por Otsu (BINARY_INV) + abertura e fechamento morfológicos
  Etapa 3: contornos externos + área, perímetro e circularidade
  Etapa 4: classificação (Circular x Retangular/Irregular) e anotação visual

Uso:
  python pipeline_formas.py                          # usa objetos_esteira.jpg
  python pipeline_formas.py minha_foto.jpg
  python pipeline_formas.py minha_foto.jpg --objetos-claros --mostrar

As imagens de cada etapa, um painel comparativo e um CSV com as métricas
são salvos na pasta de saída (padrão: resultados/).
"""

import argparse
import csv
from pathlib import Path

import cv2
import numpy as np

PASTA = Path(__file__).resolve().parent
LIMIAR_CIRCULARIDADE = 0.78
LIMIAR_RETANGULARIDADE = 0.90


# ---------------------------------------------------------------------------
# Etapa 1: Pré-processamento e Filtragem
# ---------------------------------------------------------------------------
def carregar_imagem(caminho, largura_max):
    img = cv2.imread(str(caminho))
    if img is None:
        raise FileNotFoundError(f"Não foi possível abrir a imagem: {caminho}")

    # Fotos de celular costumam ter 3000-4000 px; nesse tamanho os kernels
    # 3x3 e 5x5 ficam pequenos demais em relação ao ruído. Reduzimos a imagem.
    h, w = img.shape[:2]
    if largura_max and w > largura_max:
        escala = largura_max / w
        img = cv2.resize(img, (largura_max, int(h * escala)), interpolation=cv2.INTER_AREA)
    return img


def etapa1_preprocessamento(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # Filtro passa-baixa: atenua ruído de alta frequência preservando as bordas
    # principais melhor que um filtro de média do mesmo tamanho
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    return gray, blur


# ---------------------------------------------------------------------------
# Etapa 2: Binarização e Operações Morfológicas
# ---------------------------------------------------------------------------
def etapa2_binarizacao(blur, objetos_claros=False, iteracoes=2):
    # Otsu escolhe o limiar que maximiza a variância entre as classes
    # (objeto x fundo). BINARY_INV deixa objetos escuros em branco (255).
    tipo = cv2.THRESH_BINARY if objetos_claros else cv2.THRESH_BINARY_INV
    limiar, thresh = cv2.threshold(blur, 0, 255, tipo + cv2.THRESH_OTSU)

    if cv2.countNonZero(thresh) > thresh.size / 2:
        print("Aviso: mais da metade da imagem virou 'objeto'. Se o fundo foi "
              "segmentado no lugar dos objetos, tente a opção --objetos-claros.")

    # Abertura (erosão -> dilatação): elimina ruídos brancos pequenos e isolados
    kernel = np.ones((3, 3), np.uint8)
    opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=iteracoes)
    # Fechamento (dilatação -> erosão): fecha lacunas e rachaduras nos objetos.
    # Kernel 5x5: com 3x3 uma rachadura de ~3 px não fecha totalmente e "entra"
    # no contorno, aumentando o perímetro (ou até partindo o objeto em dois)
    kernel_fech = np.ones((5, 5), np.uint8)
    closing = cv2.morphologyEx(opening, cv2.MORPH_CLOSE, kernel_fech, iterations=iteracoes)
    return limiar, thresh, opening, closing


# ---------------------------------------------------------------------------
# Etapa 3: Extração de Contornos e Métricas Geométricas
# ---------------------------------------------------------------------------
def etapa3_metricas(mascara, area_minima):
    contours, _ = cv2.findContours(mascara, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    objetos = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        perim = cv2.arcLength(cnt, True)
        # Contornos muito pequenos são ruído que sobreviveu à morfologia
        if perim == 0 or area < area_minima:
            continue
        circularidade = (4 * np.pi * area) / (perim ** 2)
        # Retangularidade: fração do menor retângulo (rotacionado) ocupada pelo
        # objeto. Círculo ~ pi/4 = 0.785; quadrado/retângulo ~ 1.0
        (_, _), (rw, rh), _ = cv2.minAreaRect(cnt)
        retangularidade = area / (rw * rh) if rw * rh > 0 else 0
        objetos.append({
            "contorno": cnt,
            "area": area,
            "perimetro": perim,
            "circularidade": circularidade,
            "retangularidade": retangularidade,
            "bbox": cv2.boundingRect(cnt),
        })

    # Numeração de cima para baixo, da esquerda para a direita
    objetos.sort(key=lambda o: (o["bbox"][1] // 50, o["bbox"][0]))
    return objetos


# ---------------------------------------------------------------------------
# Etapa 4: Classificação Semântica e Anotação Visual
# ---------------------------------------------------------------------------
def classificar(circularidade, limiar=LIMIAR_CIRCULARIDADE, retangularidade=None):
    # Regra do enunciado: Circularidade >= 0.78 -> Circular
    if circularidade < limiar:
        return "Retangular/Irregular"
    # Regra melhorada (opcional): um quadrado tem circularidade pi/4 = 0.785,
    # praticamente igual ao limiar, mas preenche ~100% do seu retângulo mínimo
    if retangularidade is not None and retangularidade >= LIMIAR_RETANGULARIDADE:
        return "Retangular/Irregular"
    return "Circular"


def escrever(img, texto, origem, escala, cor_texto=(255, 255, 255), cor_fundo=(0, 0, 0)):
    """putText com fundo, para o rótulo ficar legível sobre qualquer cor.
    Obs.: putText não suporta acentos, por isso os rótulos são sem acento."""
    espessura = max(1, int(round(escala * 2)))
    (tw, th), base = cv2.getTextSize(texto, cv2.FONT_HERSHEY_SIMPLEX, escala, espessura)
    x, y = origem
    x = min(max(0, x), max(0, img.shape[1] - tw - 4))
    cv2.rectangle(img, (x, y - th - base - 2), (x + tw + 4, y + 2), cor_fundo, -1)
    cv2.putText(img, texto, (x + 2, y - base // 2), cv2.FONT_HERSHEY_SIMPLEX,
                escala, cor_texto, espessura, cv2.LINE_AA)


def etapa4_anotacao(img, objetos):
    saida = img.copy()
    escala = max(0.45, saida.shape[1] / 1600)

    for i, obj in enumerate(objetos, start=1):
        x, y, w, h = obj["bbox"]
        circular = obj["classe"] == "Circular"
        cor = (0, 180, 0) if circular else (0, 120, 255)  # BGR: verde / laranja

        cv2.drawContours(saida, [obj["contorno"]], -1, (255, 0, 0), 2)
        cv2.rectangle(saida, (x, y), (x + w, y + h), cor, 2)

        texto = f"#{i} {obj['classe']} | A:{int(obj['area'])}"
        # Rótulo acima da caixa; se não couber, logo abaixo da borda superior
        ty = y - 6 if y - 6 > 20 else y + 22
        escrever(saida, texto, (x, ty), escala, cor_fundo=cor)

    n_circ = sum(o["classe"] == "Circular" for o in objetos)
    resumo = (f"Total: {len(objetos)} | Circulares: {n_circ} | "
              f"Retangulares/Irregulares: {len(objetos) - n_circ}")
    escrever(saida, resumo, (8, saida.shape[0] - 10), escala * 1.1)
    return saida


# ---------------------------------------------------------------------------
# Saídas
# ---------------------------------------------------------------------------
def montar_painel(imagens, titulos, colunas=3, largura=400):
    """Junta as imagens de cada etapa em um painel único (bom para o relatório)."""
    blocos = []
    for img, titulo in zip(imagens, titulos):
        if img.ndim == 2:
            img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
        h, w = img.shape[:2]
        img = cv2.resize(img, (largura, int(h * largura / w)), interpolation=cv2.INTER_AREA)
        barra = np.full((30, largura, 3), 40, np.uint8)
        cv2.putText(barra, titulo, (8, 21), cv2.FONT_HERSHEY_SIMPLEX, 0.55,
                    (255, 255, 255), 1, cv2.LINE_AA)
        blocos.append(np.vstack([barra, img]))

    while len(blocos) % colunas:
        blocos.append(np.zeros_like(blocos[0]))
    linhas = [np.hstack(blocos[i:i + colunas]) for i in range(0, len(blocos), colunas)]
    return np.vstack(linhas)


def imprimir_tabela(objetos):
    print(f"{'#':>3} | {'Area (px)':>10} | {'Perimetro':>10} | {'Circularidade':>13} | "
          f"{'Retangularidade':>15} | Classe")
    print("-" * 84)
    for i, o in enumerate(objetos, start=1):
        print(f"{i:>3} | {o['area']:>10.1f} | {o['perimetro']:>10.1f} | "
              f"{o['circularidade']:>13.3f} | {o['retangularidade']:>15.3f} | {o['classe']}")


def salvar_csv(objetos, caminho):
    with open(caminho, "w", newline="", encoding="utf-8") as f:
        escritor = csv.writer(f)
        escritor.writerow(["objeto", "area_px", "perimetro_px", "circularidade",
                           "retangularidade", "classe", "x", "y", "largura", "altura"])
        for i, o in enumerate(objetos, start=1):
            escritor.writerow([i, round(o["area"], 1), round(o["perimetro"], 1),
                               round(o["circularidade"], 4), round(o["retangularidade"], 4),
                               o["classe"], *o["bbox"]])


def main():
    parser = argparse.ArgumentParser(description="Classificação de formas geométricas (Parte 2)")
    parser.add_argument("imagem", nargs="?", default=PASTA / "objetos_esteira.jpg")
    parser.add_argument("--saida", default=PASTA / "resultados", type=Path)
    parser.add_argument("--limiar", type=float, default=LIMIAR_CIRCULARIDADE,
                        help="circularidade mínima para 'Circular' (padrão: 0.78)")
    parser.add_argument("--area-minima", type=float, default=200,
                        help="descarta contornos com área menor (px) - ruído")
    parser.add_argument("--largura-max", type=int, default=1000,
                        help="reduz imagens mais largas que isso (0 = não reduz)")
    parser.add_argument("--regra-melhorada", action="store_true",
                        help="usa também a retangularidade para não confundir quadrados com círculos")
    parser.add_argument("--objetos-claros", action="store_true",
                        help="use se os objetos forem mais claros que o fundo")
    parser.add_argument("--mostrar", action="store_true", help="abre janelas com o resultado")
    args = parser.parse_args()

    img = carregar_imagem(args.imagem, args.largura_max)

    gray, blur = etapa1_preprocessamento(img)
    limiar_otsu, thresh, opening, closing = etapa2_binarizacao(blur, args.objetos_claros)
    objetos = etapa3_metricas(closing, args.area_minima)
    for obj in objetos:
        retang = obj["retangularidade"] if args.regra_melhorada else None
        obj["classe"] = classificar(obj["circularidade"], args.limiar, retang)
    resultado = etapa4_anotacao(img, objetos)

    args.saida.mkdir(parents=True, exist_ok=True)
    etapas = {
        "01_cinza.png": gray,
        "02_gaussiano.png": blur,
        "03_otsu.png": thresh,
        "04_abertura.png": opening,
        "05_fechamento.png": closing,
        "06_resultado.png": resultado,
    }
    for nome, imagem in etapas.items():
        cv2.imwrite(str(args.saida / nome), imagem)
    painel = montar_painel(
        list(etapas.values()),
        ["1. Escala de cinza", "2. Filtro gaussiano 5x5", f"3. Otsu (T = {limiar_otsu:.0f})",
         "4. Abertura", "5. Fechamento", "6. Classificacao"],
    )
    cv2.imwrite(str(args.saida / "painel_etapas.png"), painel)
    salvar_csv(objetos, args.saida / "metricas.csv")

    print(f"Imagem: {args.imagem}  ({img.shape[1]}x{img.shape[0]} px)")
    print(f"Limiar de Otsu: {limiar_otsu:.1f}\n")
    imprimir_tabela(objetos)
    n_circ = sum(o["classe"] == "Circular" for o in objetos)
    print(f"\nTotal: {len(objetos)} objetos ({n_circ} circulares, "
          f"{len(objetos) - n_circ} retangulares/irregulares)")
    print(f"Resultados salvos em: {args.saida}")

    if args.mostrar:
        cv2.imshow("Etapas", painel)
        cv2.imshow("Resultado", resultado)
        cv2.waitKey(0)
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
