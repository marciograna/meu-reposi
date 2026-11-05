# Reconhecimento de rostos em imagens estáticas (OpenCV)

Atividade prática de Visão Computacional. Um script em Python detecta rostos em 3 fotos com o
classificador Haar Cascade do OpenCV. Depois testamos os limites, os parâmetros e a cor e espessura do retângulo.

## Arquivos

| Arquivo | O que é |
|---|---|
| `atividade_reconhecimento_rostos.ipynb` | Notebook completo para o **Google Colab**: código original, desafio e testes extras |
| `reconhecimento_facial.py` | Código original do PDF, para rodar no computador com janela (`cv2.imshow`) |
| `gerar_resultados.py` | Gera todas as imagens de `resultados/` e a tabela `tabela_parametros.csv` |
| `fotos/` | foto1 (uma pessoa), foto2 (grupo de 4) e foto3 (multidão) |
| `resultados/` | Imagens com os rostos marcados, usadas na apresentação |

## Como rodar

> ⚠️ **Use o OpenCV 4.x.** No OpenCV 5 o `CascadeClassifier` saiu do pacote principal, e o código do PDF dá
> `AttributeError: module 'cv2' has no attribute 'CascadeClassifier'`.

**No Colab:** abra o `.ipynb`, rode as células em ordem e envie as 3 fotos quando o notebook pedir.

**No computador:**

```bash
pip install "opencv-python<5"
python reconhecimento_facial.py fotos/foto1.jpg   # código original, abre uma janela
python gerar_resultados.py                        # gera tudo em resultados/
```

## Resultados

### Teste de limites (parâmetros do PDF: `scaleFactor=1.1`, `minNeighbors=5`)

| Foto | Rostos reais | Detectados | Acertos | Falsos positivos | Falsos negativos |
|---|---|---|---|---|---|
| foto1: uma pessoa | 1 | 1 | 1 | 0 | 0 |
| foto2: grupo de 4 | 4 | 4 | 4 | 0 | 0 |
| foto3: multidão | ~100 (estimativa) | 1 | 0 | 1 | ~100 |

### Modificação de parâmetros

Cada célula mostra os rostos detectados e, entre parênteses, quantos eram falsos. A conferência foi feita olhando cada marcação.

| scaleFactor | minNeighbors | foto1 (1 rosto) | foto2 (4 rostos) | foto3 (~100) |
|---|---|---|---|---|
| 1.05 | 3 | 7 (6 falsos) | 6 (2 falsos) | 2 (2 falsos) |
| 1.05 | 5 | 5 (4 falsos) | 5 (1 falso) | 2 (2 falsos) |
| 1.05 | 8 | 3 (2 falsos) | 4 (0) | 1 (1 falso) |
| 1.1 | 3 | 4 (3 falsos) | 4 (0) | 2 (2 falsos) |
| **1.1** | **5 (original)** | **1 (0)** | **4 (0)** | **1 (1 falso)** |
| 1.1 | 8 | 1 (0) | 4 (0) | 0 |
| 1.2 | 3 | 2 (1 falso) | 4 (0) | 1 (1 falso) |
| 1.2 | 5 | 1 (0) | 4 (0) | 0 |
| 1.2 | 8 | 1 (0) | 4 (0) | 0 |

## Análise

- **Melhor desempenho: foto 2.** Encontrou 4 de 4 rostos e saiu perfeita em 7 das 9 combinações. Os rostos estão de frente, com luz uniforme e fundo liso.
- **Pior desempenho: foto 3.** Não encontrou nenhum rosto certo em nenhuma combinação. Os motivos:
  - **Tamanho:** cada rosto tem de 10 a 20 px, e o modelo foi treinado com uma janela de 24×24 px. Diminuir o `minSize` para 10×10 não mudou nada.
  - **Ângulo:** o modelo é de rosto frontal, e muita gente está de cabeça baixa olhando o celular ou de perfil.
  - **Oclusão:** óculos, bonés, cabelo e outras pessoas na frente.
- **Teste extra:** ao ampliar a foto 3 três vezes, ele encontrou 25 detecções, sendo **21 rostos certos e 4 erros**. Os erros foram uma cintura, um tronco, um rosto contado duas vezes e óculos escuros no alto da cabeça, que pareceram "olhos".
- **Padrão de classe e rigor:** o padrão de classe é o "rosto" que o modelo aprendeu no treino, só com rostos frontais. Os parâmetros definem o quanto uma região precisa se parecer com ele:
  - `minNeighbors` **alto** deixa o detector mais rigoroso: menos falsos positivos, mas mais rostos perdidos.
  - `scaleFactor` **baixo** testa mais tamanhos: fica mais sensível, mais lento e gera mais alarmes falsos.
  - Com valores permissivos, a **camisa xadrez** da foto 2 virou "rosto", porque o xadrez é puro padrão claro/escuro, como as características de Haar.
- **Modificação visual:** trocamos para magenta `(255, 0, 255)`, lembrando que o OpenCV usa BGR. A espessura passou a acompanhar o tamanho da foto. Na foto 1, que tem 3000 px, a linha de 2 px quase some quando a imagem é reduzida para 800 px.
- **Aplicação prática:** borrar rostos automaticamente antes de publicar fotos (LGPD). O resultado está em `resultados/foto2_lgpd.jpg`.
