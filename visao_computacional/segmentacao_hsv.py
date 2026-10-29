"""
Parte 3 - Desafio A: triagem de peças por cor no espaço HSV.

Adapta o pipeline da Parte 2: em vez de binarizar por Otsu na escala de cinza,
cada máscara é obtida com cv2.inRange no espaço HSV (Matiz, Saturação, Valor).
Para cada cor, as peças são contadas e classificadas pela forma.

Uso:
  python segmentacao_hsv.py                          # usa pecas_coloridas.jpg
  python segmentacao_hsv.py minha_foto.jpg
  python segmentacao_hsv.py minha_foto.jpg --amostrar 120 80   # HSV do pixel (x=120, y=80)

Observação: no OpenCV, H vai de 0 a 179 (graus / 2), S e V de 0 a 255.
"""

import argparse
from pathlib import Path

import cv2
import numpy as np

from pipeline_formas import (
    LIMIAR_CIRCULARIDADE,
    carregar_imagem,
    classificar,
    escrever,
    etapa3_metricas,
    montar_painel,
)

PASTA = Path(__file__).resolve().parent

# Intervalos (H, S, V) mínimo e máximo de cada cor. O vermelho fica nas duas
# pontas do círculo de matiz (0 e 180), por isso precisa de dois intervalos.
# S mínimo alto descarta peças brancas/cinzas/pretas, cuja matiz é instável.
FAIXAS_HSV = {
    "Vermelho": [((0, 100, 60), (10, 255, 255)), ((170, 100, 60), (179, 255, 255))],
    "Amarelo": [((20, 100, 60), (35, 255, 255))],
    "Verde": [((40, 80, 50), (85, 255, 255))],
    "Azul": [((95, 100, 50), (130, 255, 255))],
}

# Cor (BGR) usada para desenhar as anotações de cada classe de cor
COR_DESENHO = {
    "Vermelho": (0, 0, 220),
    "Amarelo": (0, 190, 230),
    "Verde": (0, 160, 0),
    "Azul": (200, 80, 0),
}


def mascara_cor(hsv, faixas, iteracoes=2):
    mascara = np.zeros(hsv.shape[:2], np.uint8)
    for minimo, maximo in faixas:
        mascara |= cv2.inRange(hsv, np.array(minimo), np.array(maximo))

    # Mesmo ajuste morfológico da Parte 2
    kernel = np.ones((3, 3), np.uint8)
    mascara = cv2.morphologyEx(mascara, cv2.MORPH_OPEN, kernel, iterations=iteracoes)
    kernel_fech = np.ones((5, 5), np.uint8)
    mascara = cv2.morphologyEx(mascara, cv2.MORPH_CLOSE, kernel_fech, iterations=iteracoes)
    return mascara


def main():
    parser = argparse.ArgumentParser(description="Triagem de peças por cor em HSV (Parte 3)")
    parser.add_argument("imagem", nargs="?", default=PASTA / "pecas_coloridas.jpg")
    parser.add_argument("--saida", default=PASTA / "resultados_hsv", type=Path)
    parser.add_argument("--limiar", type=float, default=LIMIAR_CIRCULARIDADE)
    parser.add_argument("--area-minima", type=float, default=200)
    parser.add_argument("--regra-melhorada", action="store_true",
                        help="usa também a retangularidade (ver pipeline_formas.py)")
    parser.add_argument("--largura-max", type=int, default=1000)
    parser.add_argument("--amostrar", type=int, nargs=2, metavar=("X", "Y"),
                        help="mostra o valor HSV de um pixel, para calibrar as faixas")
    parser.add_argument("--mostrar", action="store_true")
    args = parser.parse_args()

    img = carregar_imagem(args.imagem, args.largura_max)
    blur = cv2.GaussianBlur(img, (5, 5), 0)
    hsv = cv2.cvtColor(blur, cv2.COLOR_BGR2HSV)

    if args.amostrar:
        x, y = args.amostrar
        h, s, v = hsv[y, x]
        print(f"Pixel (x={x}, y={y}) -> H={h}  S={s}  V={v}")
        return

    args.saida.mkdir(parents=True, exist_ok=True)
    resultado = img.copy()
    escala = max(0.45, img.shape[1] / 1600)
    mascaras, contagem = {}, {}

    for nome_cor, faixas in FAIXAS_HSV.items():
        mascara = mascara_cor(hsv, faixas)
        mascaras[nome_cor] = mascara
        cv2.imwrite(str(args.saida / f"mascara_{nome_cor.lower()}.png"), mascara)

        objetos = etapa3_metricas(mascara, args.area_minima)
        contagem[nome_cor] = {"Circular": 0, "Retangular/Irregular": 0}
        for obj in objetos:
            retang = obj["retangularidade"] if args.regra_melhorada else None
            obj["classe"] = classificar(obj["circularidade"], args.limiar, retang)
            contagem[nome_cor][obj["classe"]] += 1

            x, y, w, h = obj["bbox"]
            cor = COR_DESENHO[nome_cor]
            cv2.drawContours(resultado, [obj["contorno"]], -1, (255, 255, 255), 2)
            cv2.rectangle(resultado, (x, y), (x + w, y + h), cor, 2)
            forma = "Circ" if obj["classe"] == "Circular" else "Ret/Irr"
            ty = y - 6 if y - 6 > 20 else y + 22
            escrever(resultado, f"{nome_cor} | {forma} | A:{int(obj['area'])}", (x, ty),
                     escala, cor_fundo=cor)

    total = sum(sum(c.values()) for c in contagem.values())
    escrever(resultado, f"Pecas coloridas: {total}", (8, resultado.shape[0] - 10), escala * 1.1)
    cv2.imwrite(str(args.saida / "resultado_hsv.png"), resultado)

    painel = montar_painel(
        [img, *mascaras.values(), resultado],
        ["Original", *[f"Mascara {c}" for c in mascaras], "Triagem por cor + forma"],
    )
    cv2.imwrite(str(args.saida / "painel_hsv.png"), painel)

    print(f"Imagem: {args.imagem}\n")
    print(f"{'Cor':<10} | {'Circular':>8} | {'Ret/Irreg':>9} | {'Total':>5}")
    print("-" * 42)
    for nome_cor, c in contagem.items():
        print(f"{nome_cor:<10} | {c['Circular']:>8} | {c['Retangular/Irregular']:>9} | "
              f"{sum(c.values()):>5}")
    print("-" * 42)
    print(f"{'Total':<10} | {'':>8} | {'':>9} | {total:>5}")
    print(f"\nResultados salvos em: {args.saida}")

    if args.mostrar:
        cv2.imshow("Triagem HSV", painel)
        cv2.waitKey(0)
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
