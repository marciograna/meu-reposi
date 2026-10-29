# Parte 1 – Questões conceituais

Cada questão tem uma **resposta resumida**, que cabe nas linhas da folha, e uma
**fundamentação** mais completa para o relatório ou para a apresentação. Os
números citados vêm dos testes deste projeto (ver `README.md`).

---

## Questão 1 – Diferenciação de níveis

**Resposta resumida:**
O Processamento de Imagens recebe uma imagem e devolve outra imagem: ele altera
os valores dos pixels para melhorar ou realçar a imagem, sem interpretar o
conteúdo. O filtro gaussiano, por exemplo, suaviza do mesmo jeito qualquer
imagem, sem "saber" que ali existe um objeto. A Visão Computacional recebe a
imagem e devolve **informação semântica**: o que há na cena, onde está e
quantos são. É o caso de rótulos, caixas delimitadoras, contagens e decisões. O
processamento de imagens costuma ser a etapa de pré-processamento da visão
computacional.

**Fundamentação:**

- **Entrada e saída.** No Processamento de Imagens, a entrada e a saída são
  imagens.
  - A filtragem gaussiana é uma convolução com um kernel gaussiano (um filtro
    passa-baixa): cada pixel de saída é uma média ponderada da sua vizinhança.
  - A equalização de histograma aplica uma função de transferência baseada na
    distribuição acumulada (CDF) das intensidades.
  - Nos dois casos, a operação é matemática, determinística e independe do
    significado da cena.
- **Interpretação.** A Visão Computacional produz uma descrição simbólica da
  cena: rótulos ("Circular"), coordenadas, medidas, contagens e decisões
  (aceitar ou rejeitar uma peça). Para isso, ela precisa de um modelo de
  conhecimento sobre os objetos, que pode ser feito de regras, descritores ou
  modelos treinados.
- **Hierarquia de níveis (Gonzalez & Woods):**
  - **Baixo nível:** imagem → imagem (redução de ruído, realce de contraste).
  - **Médio nível:** imagem → atributos (segmentação, contornos, descritores).
  - **Alto nível:** atributos → significado (reconhecimento, interpretação da
    cena).

  O Processamento de Imagens ocupa o baixo nível. A Visão Computacional cobre o
  médio e o alto nível.
- **Neste trabalho:**
  - As Etapas 1 e 2 (filtro gaussiano, Otsu e morfologia) são Processamento de
    Imagens, porque a saída ainda é uma imagem (a máscara binária).
  - As Etapas 3 e 4 são Visão Computacional, porque a saída passa a ser números
    (área, perímetro, circularidade), rótulos ("Circular" ou
    "Retangular/Irregular") e a contagem de objetos.
  - A binarização é a fronteira entre os dois: ela ainda gera uma imagem, mas já
    separa objeto e fundo, que é o início da segmentação.

---

## Questão 2 – Limiarização vs. segmentação semântica

**Resposta resumida:**
Otsu e HSV bastam em cenas **controladas**, nas quais o objeto se diferencia do
fundo só pela intensidade (histograma bimodal) ou por uma cor bem saturada. Isso
exige iluminação uniforme, fundo homogêneo e objetos separados, como peças numa
esteira industrial, documentos digitalizados ou células coradas. CNNs tornam-se
indispensáveis quando a separação depende de **contexto e semântica**, e não de
um limiar: fundo complexo, iluminação variável, sombras, oclusão, objetos com
cor ou intensidade parecida com o fundo, ou classes diferentes com aparência
semelhante.

**Fundamentação:**

- **Otsu** escolhe o limiar *t* que maximiza a variância entre as classes,
  σ²_B(t) = ω₀(t)·ω₁(t)·[μ₀(t) − μ₁(t)]². Isso equivale a minimizar a variância
  dentro de cada classe. O método parte de dois pressupostos: o histograma é
  bimodal e um único limiar global serve para a imagem toda.
  - **Funciona bem** com alto contraste, iluminação controlada (cabine de
    inspeção, luz de fundo) e fundo uniforme.
  - **Falha** em quatro situações:
    - Iluminação desigual ou sombras: um único limiar não serve para todas as
      regiões, e a solução é a limiarização adaptativa ou a correção de fundo.
    - Objetos muito pequenos em relação ao fundo: o histograma fica
      desbalanceado e o vale entre os picos some.
    - Mais de duas classes de intensidade (o caso pede multi-Otsu).
    - Baixa relação sinal/ruído.
- **HSV** separa a cor (H = matiz, S = saturação) do brilho (V). Por isso, a
  matiz varia pouco quando a luz fica mais forte ou mais fraca, ao contrário do
  RGB, em que os três canais mudam juntos.
  - **Funciona bem** quando a classe é definida por uma cor saturada e diferente
    do fundo: triagem de frutas por maturação, peças coloridas, sinalização,
    chroma key.
  - **Limitações:**
    - A matiz fica instável quando S ou V são baixos. Objetos brancos, cinzas e
      pretos não têm uma matiz confiável: no teste deste projeto, a peça branca
      tem **S = 1 e H = 150**, um valor sem significado, e por isso cada faixa
      exige um S mínimo.
    - O vermelho fica nas duas pontas do círculo de matiz (perto de 0 e de 179),
      então precisa de dois intervalos.
    - A temperatura de cor da lâmpada e o balanço de branco da câmera deslocam a
      matiz.
    - Reflexos especulares derrubam a saturação.
    - Um objeto da mesma cor do fundo não pode ser separado.
- **CNNs são indispensáveis quando:**
  - A classe é **semântica**, e não definida por cor ou intensidade: distinguir
    cachorro de gato, pedestre de poste, ou tecido doente de tecido saudável com
    a mesma intensidade.
  - O fundo é texturizado ou complexo (ruas, cenas naturais).
  - A iluminação não é controlada e há variação de pose, escala ou ponto de
    vista.
  - Há objetos encostados ou sobrepostos, o que pede segmentação de instâncias
    (Mask R-CNN, YOLO-seg).
  - Há grande variação dentro de uma mesma classe e pouca diferença entre
    classes distintas.
  - É preciso classificar cada pixel entre muitas classes, o que pede
    segmentação semântica (U-Net, DeepLab).

  As CNNs **aprendem os próprios descritores** a partir dos dados, em camadas
  hierárquicas: bordas → texturas → partes → objetos. O custo é alto: muitos
  dados rotulados, GPU, menor interpretabilidade e risco de *overfitting*.
- **Conclusão:** se é possível controlar a cena (iluminação, fundo,
  posicionamento), a técnica clássica resolve e ainda é rápida, explicável e
  dispensa treinamento, como no protótipo deste trabalho. Se não é possível
  controlar a cena, é preciso aprendizado.

---

## Questão 3 – Invariância e descritores geométricos

**Resposta resumida:**
Os descritores são calculados sobre o **contorno da máscara binária**, e não
sobre o objeto real. Qualquer erro da binarização ou da morfologia muda o
contorno e, com ele, a área, o perímetro, a razão de aspecto e os momentos.
Entre esses erros estão ruído na borda, buracos, rachaduras, objetos fundidos ou
partidos e sombras incorporadas. O perímetro é o descritor mais sensível: uma
borda serrilhada aumenta P quase sem mudar a área. Como a circularidade usa P²,
o erro é amplificado e pode trocar a classe do objeto.

**Fundamentação:**

1. **Cadeia de dependência.** O fluxo é imagem → filtro → binarização →
   morfologia → contorno → descritores → classificação. A etapa de alto nível
   enxerga apenas a máscara, então um erro na base se propaga até o resultado
   (*garbage in, garbage out*).
2. **O perímetro amplifica o erro.** Como C = 4πA/P², um perímetro 10% maior
   reduz a circularidade em cerca de 17% (1/1,1² ≈ 0,83). Um círculo com C ≈ 0,90
   e borda ruidosa pode cair abaixo de 0,78 e ser classificado como
   "Irregular".
3. **Erros de topologia** mudam a contagem e as formas:
   - **Objeto partido:** um reflexo ou uma rachadura que o fechamento não
     preenche divide o objeto em dois contornos. No teste, **sem o fechamento, o
     retângulo rachado virou dois objetos (8 contados em vez de 7)**.
   - **Objetos fundidos:** dois objetos encostados, ou ligados por uma sombra,
     formam um único contorno com a área somada e uma forma irregular.
   - **Ruído não removido:** gera contornos falsos. **Sem filtro e sem
     morfologia, surgiram 1057 contornos para 7 objetos reais.**
4. **A própria morfologia distorce quando é mal dimensionada.**
   - Uma abertura com kernel grande arredonda cantos: um quadrado ganha
     circularidade e se aproxima de "Circular".
   - A abertura também apaga objetos pequenos ou finos.
   - Um fechamento exagerado une objetos próximos.

   O elemento estruturante deve ser maior que o ruído e menor que os detalhes
   que se quer preservar.
5. **Momentos de Hu.** Eles derivam dos momentos centrais normalizados e são
   invariantes a translação, escala e rotação. Mas invariância geométrica não é
   robustez a ruído. Os momentos de ordem mais alta ponderam cada pixel por
   potências da sua distância ao centroide. Assim, poucos pixels espúrios na
   periferia, como ruído grudado no objeto ou uma sombra, mudam bastante os
   valores.
6. **Razão de aspecto.** Ela depende da caixa delimitadora, que é definida
   pelos pixels mais extremos. Uma única "ponta" de ruído ligada ao objeto
   altera a largura ou a altura da caixa.
7. **Discretização.** Mesmo uma máscara perfeita é uma aproximação em pixels.
   - O `arcLength` mede o perímetro sobre a cadeia de pixels. Por isso, um
     círculo digital fica com C ≈ 0,90 neste trabalho, e não 1,0.
   - Um quadrado ideal tem C = π/4 ≈ **0,785**, praticamente igual ao limiar de
     0,78.
   - Com essa margem estreita entre as classes, o sistema depende ainda mais de
     uma máscara limpa.

**Conclusão:** a invariância dos descritores é uma propriedade matemática da
forma ideal. Na prática, ela só vale se a segmentação entregar uma máscara fiel
ao objeto. Por isso, a qualidade do pré-processamento determina a
confiabilidade de toda a etapa semântica.

---

### Referências

- GONZALEZ, R. C.; WOODS, R. E. *Processamento Digital de Imagens*. 3. ed. São Paulo: Pearson, 2010.
- OTSU, N. A threshold selection method from gray-level histograms. *IEEE Transactions on Systems, Man, and Cybernetics*, v. 9, n. 1, p. 62–66, 1979.
- HU, M.-K. Visual pattern recognition by moment invariants. *IRE Transactions on Information Theory*, v. 8, n. 2, p. 179–187, 1962.
- SZELISKI, R. *Computer Vision: Algorithms and Applications*. 2. ed. Springer, 2022.
- RONNEBERGER, O.; FISCHER, P.; BROX, T. U-Net: Convolutional Networks for Biomedical Image Segmentation. *MICCAI*, 2015.
- HE, K. et al. Mask R-CNN. *IEEE International Conference on Computer Vision (ICCV)*, 2017.
