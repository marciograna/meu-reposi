"""
Gera imagens sintéticas para testar o pipeline enquanto você não tem a sua
própria foto. Substitua-as por uma imagem do celular ou da internet para a
entrega final.

Gera:
  - objetos_esteira.jpg  -> tons de cinza, objetos escuros sobre fundo claro (Parte 2)
  - pecas_coloridas.jpg  -> peças coloridas sobre esteira cinza (Parte 3 - HSV)

As imagens têm ruído gaussiano, ruído sal-e-pimenta, iluminação levemente
desigual, um reflexo dentro de um círculo e uma "rachadura" em um retângulo,
para justificar o uso do filtro gaussiano, da abertura e do fechamento.

Uso:
  python gerar_imagens_teste.py
"""

from pathlib import Path

import cv2
import numpy as np

PASTA = Path(__file__).resolve().parent
LARGURA, ALTURA = 800, 600
rng = np.random.default_rng(42)


def adicionar_ruido(img, sigma=12, prob_sal_pimenta=0.005):
    """Ruído gaussiano + sal e pimenta."""
    ruidosa = img.astype(np.float32) + rng.normal(0, sigma, img.shape)
    ruidosa = np.clip(ruidosa, 0, 255).astype(np.uint8)
    sorteio = rng.random(img.shape[:2])
    ruidosa[sorteio < prob_sal_pimenta / 2] = 0
    ruidosa[sorteio > 1 - prob_sal_pimenta / 2] = 255
    return ruidosa


def gerar_cinza():
    # Fundo claro com iluminação levemente desigual (gradiente horizontal)
    gradiente = np.linspace(185, 215, LARGURA, dtype=np.float32)
    img = np.tile(gradiente, (ALTURA, 1)).astype(np.uint8)
    obj = 70

    # Círculos
    cv2.circle(img, (150, 140), 75, obj, -1)
    cv2.circle(img, (640, 460), 60, obj, -1)
    cv2.circle(img, (655, 445), 4, 205, -1)          # reflexo dentro do círculo
    cv2.circle(img, (470, 300), 32, obj, -1)

    # Quadrado e retângulo
    cv2.rectangle(img, (320, 60), (430, 170), obj, -1)
    cv2.rectangle(img, (60, 390), (280, 480), obj, -1)
    cv2.line(img, (170, 390), (185, 480), 200, 3)     # rachadura no retângulo

    # Triângulo
    triangulo = np.array([[560, 60], [720, 60], [640, 200]], np.int32)
    cv2.fillPoly(img, [triangulo], obj)

    # Forma irregular (estrela de 5 pontas)
    cx, cy = 380, 460
    pontos = []
    for i in range(10):
        raio = 80 if i % 2 == 0 else 35
        ang = np.pi / 2 + i * np.pi / 5
        pontos.append([cx + raio * np.cos(ang), cy - raio * np.sin(ang)])
    cv2.fillPoly(img, [np.array(pontos, np.int32)], obj)

    # Sujeira: pontinhos escuros espalhados (devem sumir com filtro + abertura)
    for _ in range(40):
        x, y = rng.integers(0, LARGURA), rng.integers(0, ALTURA)
        cv2.circle(img, (int(x), int(y)), 1, 90, -1)

    img = adicionar_ruido(img)
    cv2.imwrite(str(PASTA / "objetos_esteira.jpg"), img, [cv2.IMWRITE_JPEG_QUALITY, 90])


def gerar_colorida():
    # Esteira cinza clara com leve sombreamento vertical
    sombra = np.linspace(200, 175, ALTURA, dtype=np.float32)[:, None, None]
    img = np.ones((ALTURA, LARGURA, 3), np.float32) * sombra
    img = img.astype(np.uint8)

    vermelho, verde, azul, amarelo = (40, 40, 210), (60, 170, 50), (200, 90, 30), (40, 210, 230)

    cv2.circle(img, (120, 120), 65, vermelho, -1)
    cv2.rectangle(img, (240, 60), (360, 180), verde, -1)
    cv2.circle(img, (480, 120), 55, amarelo, -1)
    cv2.rectangle(img, (600, 90), (770, 175), azul, -1)

    cv2.rectangle(img, (60, 280), (230, 370), vermelho, -1)
    cv2.circle(img, (340, 330), 60, azul, -1)
    triangulo = np.array([[450, 390], [600, 390], [525, 260]], np.int32)
    cv2.fillPoly(img, [triangulo], amarelo)
    cv2.circle(img, (690, 330), 55, verde, -1)

    # Peça cinza/branca (acromática): não deve aparecer em nenhuma máscara de cor
    cv2.circle(img, (160, 500), 55, (235, 235, 235), -1)
    cv2.circle(img, (400, 500), 45, vermelho, -1)
    cv2.rectangle(img, (540, 450), (720, 560), amarelo, -1)

    img = adicionar_ruido(img, sigma=8, prob_sal_pimenta=0.002)
    cv2.imwrite(str(PASTA / "pecas_coloridas.jpg"), img, [cv2.IMWRITE_JPEG_QUALITY, 90])


if __name__ == "__main__":
    gerar_cinza()
    gerar_colorida()
    print("Imagens geradas: objetos_esteira.jpg e pecas_coloridas.jpg")
