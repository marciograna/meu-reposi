"""Código original da atividade (transcrito do PDF), para rodar no computador.

Uso:
    pip install "opencv-python<5"      # no OpenCV 5 o CascadeClassifier não existe mais
    python reconhecimento_facial.py fotos/foto1.jpg
"""
import sys

import cv2

arquivo = sys.argv[1] if len(sys.argv) > 1 else 'fotos/foto1.jpg'

# Carrega o classificador pré-treinado para reconhecimento de rostos
classificador_rosto = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Carrega a imagem estática (substituir 'foto1.jpg' pelo nome do arquivo baixado)
imagem = cv2.imread(arquivo)
if imagem is None:
    sys.exit(f'Não achei a imagem {arquivo}')

# Converte a imagem para tons de cinza (simplifica o processamento)
imagem_cinza = cv2.cvtColor(imagem, cv2.COLOR_BGR2GRAY)

# Realiza o processo de classificação e detecta os rostos na imagem
rostos = classificador_rosto.detectMultiScale(imagem_cinza, scaleFactor=1.1,
                                              minNeighbors=5, minSize=(30, 30))
print(f'{len(rostos)} rosto(s) detectado(s) em {arquivo}')

# Desenha um retângulo verde ao redor de cada rosto detectado
for (x, y, w, h) in rostos:
    cv2.rectangle(imagem, (x, y), (x+w, y+h), (0, 255, 0), 2)

# Redimensiona a imagem para caber melhor na tela caso seja muito grande
imagem_redimensionada = cv2.resize(imagem, (800, 600))

# Mostra o resultado final na tela
cv2.imshow('Reconhecimento - Pressione qualquer tecla para fechar', imagem_redimensionada)

# Espera até que o usuário pressione qualquer tecla e fecha a janela
cv2.waitKey(0)
cv2.destroyAllWindows()
