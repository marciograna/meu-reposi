# Linux Lab

Site estático para estudar comandos do Linux: básico, intermediário e avançado.

- **Destrinchador**: cole um comando (`ls -lha`, `tar -xzvf backup.tar.gz`, `ps aux | grep nginx`) e veja o que cada letra, valor, argumento e operador faz.
- **57 fichas de comandos** separadas por nível, com a origem do nome, as opções (com a letra destacada: **l** de *long*), exemplos para copiar e dicas.
- **Progresso**: marque "Aprendi" ou "Revisar depois". Fica salvo no navegador.
- **Busca**, filtro por nível e por progresso, tema claro e escuro.

Não tem build nem dependências: é HTML, CSS e JavaScript puro.

## Rodar no computador

```bash
cd linux-lab
python3 -m http.server 8000
# abra http://localhost:8000
```

Abrir o `index.html` direto no navegador também funciona.

## Publicar no Netlify

O `netlify.toml` na raiz do repositório já diz ao Netlify para publicar **só a pasta `linux-lab`**. O app Vulnado fica de fora.

1. Entre em <https://app.netlify.com> e clique em **Add new site → Import an existing project**.
2. Escolha o GitHub e este repositório.
3. Em **Branch to deploy**, escolha a branch que tem o site (ex.: `main`, depois do merge).
4. Deixe os outros campos como estão (o `netlify.toml` cuida disso) e clique em **Deploy**.

Cada `git push` nessa branch publica uma nova versão automaticamente.

**Atalho sem GitHub:** arraste a pasta `linux-lab` para <https://app.netlify.com/drop>.

## Adicionar ou corrigir um comando

Tudo está em `js/comandos.js`. Cada comando é um objeto assim:

```js
{
  c: "ls", n: "basico", cat: "Navegação", nome: "list",
  r: "Lista arquivos e diretórios",
  s: "ls [opções] [caminho...]",
  pos: ["pasta ou arquivo a listar"],
  f: {
    "-l": ["long", "formato detalhado: permissões, dono, grupo, tamanho e data"],
    "-n": ["number", "quantas linhas", { arg: "N" }]   // opção que recebe valor
  },
  ex: [["ls -lha", "lista tudo, até os ocultos, com tamanhos legíveis"]],
  dica: "...",
  perigo: "..."
}
```

- `n` é o nível: `basico`, `intermediario` ou `avancado`.
- Em `f`, o primeiro texto é a palavra de onde vem a letra. O site destaca a letra sozinho (**l** de *long*). Se a letra estiver no meio da palavra, marque com colchetes: `"g[z]ip"`.
- Os outros campos opcionais estão descritos no topo do arquivo.

Para conferir se todos os exemplos continuam sendo reconhecidos pelo destrinchador, rode o teste:

```bash
node linux-lab/testes/explicador.test.js
```

## Estrutura

```
linux-lab/
├── index.html
├── css/style.css
├── js/comandos.js     ← dicionário de comandos (edite aqui)
├── js/explicador.js   ← destrinchador (funções puras, sem DOM)
├── js/app.js          ← interface
└── testes/explicador.test.js
```
