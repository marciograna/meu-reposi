"""Gera todas as imagens e a tabela usadas na apresentação.

Uso (na pasta do projeto):
    pip install "opencv-python<5"
    python gerar_resultados.py

Lê fotos/foto1.jpg, foto2.jpg e foto3.jpg e salva tudo em resultados/.
"""
import os
import cv2
import numpy as np

PASTA_FOTOS = 'fotos'
PASTA_SAIDA = 'resultados'
FOTOS = ['foto1.jpg', 'foto2.jpg', 'foto3.jpg']
SCALES = (1.05, 1.1, 1.2)
VIZINHOS = (3, 5, 8)

VERDE = (0, 255, 0)
VERMELHO = (0, 0, 255)   # o OpenCV usa BGR, não RGB
MAGENTA = (255, 0, 255)

classificador = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
if classificador.empty():
    raise RuntimeError('Classificador não carregou. Use OpenCV 4.x: pip install "opencv-python<5"')


def carregar(nome):
    imagem = cv2.imread(os.path.join(PASTA_FOTOS, nome))
    if imagem is None:
        raise FileNotFoundError(f'Não achei {nome} na pasta {PASTA_FOTOS}/')
    return imagem


def detectar(imagem, scale=1.1, vizinhos=5):
    cinza = cv2.cvtColor(imagem, cv2.COLOR_BGR2GRAY)
    return classificador.detectMultiScale(cinza, scaleFactor=scale, minNeighbors=vizinhos, minSize=(30, 30))


def desenhar(imagem, rostos, cor=VERDE, espessura=2):
    saida = imagem.copy()
    for (x, y, w, h) in rostos:
        cv2.rectangle(saida, (x, y), (x + w, y + h), cor, espessura)
    return saida


def largura(imagem, alvo=800):
    """Redimensiona mantendo a proporção (o resize(800, 600) do PDF achata as fotos)."""
    fator = alvo / imagem.shape[1]
    return cv2.resize(imagem, None, fx=fator, fy=fator, interpolation=cv2.INTER_AREA)


def altura(imagem, alvo):
    fator = alvo / imagem.shape[0]
    return cv2.resize(imagem, None, fx=fator, fy=fator, interpolation=cv2.INTER_AREA)


def rotulo(imagem, texto):
    saida = imagem.copy()
    cv2.rectangle(saida, (0, 0), (saida.shape[1], 44), (30, 30, 30), -1)
    cv2.putText(saida, texto, (12, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2, cv2.LINE_AA)
    return saida


def lado_a_lado(pares, alvo_altura=600, espaco=16):
    """pares = [(imagem, texto), ...]; o rótulo entra depois do resize para ficar do mesmo tamanho."""
    redim = [rotulo(altura(im, alvo_altura), texto) for im, texto in pares]
    branco = np.full((alvo_altura, espaco, 3), 255, dtype=np.uint8)
    partes = []
    for i, im in enumerate(redim):
        if i:
            partes.append(branco)
        partes.append(im)
    return np.hstack(partes)


def salvar(nome, imagem):
    cv2.imwrite(os.path.join(PASTA_SAIDA, nome), imagem, [cv2.IMWRITE_JPEG_QUALITY, 90])
    print('salvo:', nome)


def main():
    os.makedirs(PASTA_SAIDA, exist_ok=True)
    imagens = {nome: carregar(nome) for nome in FOTOS}

    # 1) Código original do PDF (verde, espessura 2, scale 1.1, minNeighbors 5)
    for nome, imagem in imagens.items():
        rostos = detectar(imagem)
        salvar(nome.replace('.jpg', '_original.jpg'), largura(desenhar(imagem, rostos)))

    # 2) Teste de parâmetros: 9 combinações por foto
    print('\nfoto       scale  minNeighbors  rostos detectados')
    linhas = []
    for nome, imagem in imagens.items():
        for scale in SCALES:
            for viz in VIZINHOS:
                n = len(detectar(imagem, scale, viz))
                linhas.append((nome, scale, viz, n))
                print(f'{nome:<10} {scale:<6} {viz:<13} {n}')
    with open(os.path.join(PASTA_SAIDA, 'tabela_parametros.csv'), 'w', encoding='utf-8') as f:
        f.write('foto,scaleFactor,minNeighbors,rostos_detectados\n')
        for nome, scale, viz, n in linhas:
            f.write(f'{nome},{scale},{viz},{n}\n')

    # 3) Efeito dos parâmetros na foto1: permissivo x padrão
    foto1 = imagens['foto1.jpg']
    esp1 = 12  # a foto1 tem 3000 px de largura: espessura 2 some ao reduzir
    permissivo = desenhar(foto1, detectar(foto1, 1.05, 3), VERMELHO, esp1)
    padrao = desenhar(foto1, detectar(foto1, 1.1, 5), VERDE, esp1)
    salvar('comparacao_parametros_foto1.jpg',
           lado_a_lado([(permissivo, 'scale 1.05 / vizinhos 3'), (padrao, 'scale 1.1 / vizinhos 5')], 900))

    # 4) Mudança visual: cor magenta e espessura proporcional ao tamanho da foto
    for nome, imagem in imagens.items():
        espessura = max(4, imagem.shape[1] // 200)
        rostos = detectar(imagem)
        salvar(nome.replace('.jpg', '_visual.jpg'), largura(desenhar(imagem, rostos, MAGENTA, espessura)))

    # 5) Melhor x pior desempenho (foto2 x foto3)
    foto2, foto3 = imagens['foto2.jpg'], imagens['foto3.jpg']
    melhor = desenhar(foto2, detectar(foto2), VERDE, 3)
    pior = desenhar(foto3, detectar(foto3), VERMELHO, 3)
    salvar('melhor_vs_pior.jpg',
           lado_a_lado([(melhor, 'Melhor: 4 de 4 rostos'), (pior, 'Pior: 0 de ~100 rostos')], 560))

    # 6) Extra: ampliar a foto3 3x faz os rostos passarem do tamanho mínimo do detector
    ampliada = cv2.resize(foto3, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)
    rostos_amp = detectar(ampliada)
    print(f'\nfoto3 ampliada 3x: {len(rostos_amp)} rostos detectados')
    salvar('foto3_ampliada_3x.jpg', largura(desenhar(ampliada, rostos_amp, VERDE, 4), 1200))

    # 7) Aplicação prática: borrar rostos para proteger a privacidade (LGPD)
    anonima = foto2.copy()
    for (x, y, w, h) in detectar(foto2):
        anonima[y:y + h, x:x + w] = cv2.GaussianBlur(anonima[y:y + h, x:x + w], (51, 51), 30)
    salvar('foto2_lgpd.jpg', anonima)


if __name__ == '__main__':
    main()
