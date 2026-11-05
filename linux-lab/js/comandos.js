/*
 * Linux Lab: dicionário de comandos.
 *
 * Cada comando:
 *   c     nome do comando
 *   n     nível: "basico" | "intermediario" | "avancado"
 *   cat   categoria (usada na busca)
 *   nome  de onde vem o nome (ajuda a decorar)
 *   r     resumo de uma linha
 *   s     sintaxe
 *   pos   o que significa cada argumento posicional (o último se repete)
 *   f     opções: { "-l": [palavra, descrição, extras?] }
 *         a letra da opção aparece destacada dentro da "palavra" (l de long)
 *         extras: { arg: "nome do valor", v: {valor: explicação}, fn: "size" | "dias" |
 *                   "minutos" | "perm" | "modo" | "sed", opc: /regex/ (só consome o
 *                   próximo item se combinar), colado: true (valor só colado: -i.bak),
 *                   ate: true (consome até \; ou +, como o -exec do find) }
 *   ex    exemplos: [comando, explicação]
 *   dica  dica para fixar
 *   perigo aviso de cuidado
 *   Outros campos opcionais: sub (subcomandos), esp (argumentos especiais), kv (chave=valor
 *   no estilo do dd), bsd (letras sem traço, como ps aux), prefixo (o resto é outro comando),
 *   num (atalho -N), unico (opções de traço único com nome inteiro, como no find),
 *   especial (explicador próprio para o 1º argumento), alias (outros nomes).
 */
(function (global) {
  "use strict";

  global.COMANDOS = [
    /* ───────────────────────── BÁSICO ───────────────────────── */
    {
      c: "pwd", n: "basico", cat: "Navegação", nome: "print working directory",
      r: "Mostra em qual diretório você está",
      s: "pwd [opções]",
      f: {
        "-P": ["physical", "mostra o caminho real, resolvendo links simbólicos"],
        "-L": ["logical", "mostra o caminho como você navegou, mantendo os links simbólicos (padrão)"]
      },
      ex: [["pwd", "mostra o caminho completo da pasta atual"]],
      dica: "Perdeu-se no terminal? O pwd é o \"você está aqui\" do mapa do shopping."
    },
    {
      c: "ls", n: "basico", cat: "Navegação", nome: "list",
      r: "Lista arquivos e diretórios",
      s: "ls [opções] [caminho...]",
      pos: ["pasta ou arquivo a listar (sem nada, lista a pasta atual)"],
      f: {
        "-l": ["long", "formato detalhado: permissões, dono, grupo, tamanho e data"],
        "-a": ["all", "mostra tudo, inclusive arquivos ocultos (os que começam com .)"],
        "-A": ["almost-all", "igual ao -a, mas esconde o . e o .."],
        "-h": ["human-readable", "tamanhos legíveis (K, M, G) em vez de bytes; aparece junto com o -l"],
        "-t": ["time", "ordena por data de modificação, mais recente primeiro"],
        "-r": ["reverse", "inverte a ordem da listagem"],
        "-S": ["Size", "ordena por tamanho, maior primeiro"],
        "-R": ["Recursive", "entra em todas as subpastas"],
        "-1": ["um por linha", "mostra um item por linha"],
        "-d": ["directory", "lista a própria pasta, não o conteúdo dela"],
        "-i": ["inode", "mostra o número do inode de cada arquivo"],
        "-F": ["classify", "adiciona um símbolo no fim: / pasta, * executável, @ link"],
        "--color": ["color", "colore a saída por tipo de arquivo", { arg: "quando", v: { auto: "só colore quando a saída é o terminal", always: "sempre colore", never: "nunca colore" } }]
      },
      ex: [
        ["ls -lha", "lista tudo, até os ocultos, com tamanhos legíveis"],
        ["ls -ltr", "detalhado e ordenado por data; o mais recente fica no fim"],
        ["ls -lhS /var/log", "arquivos de log do maior para o menor"],
        ["ls -d */", "lista só as pastas do diretório atual"]
      ],
      dica: "A ordem das letras não importa: ls -lha, ls -hal e ls -l -h -a fazem a mesma coisa."
    },
    {
      c: "cd", n: "basico", cat: "Navegação", nome: "change directory",
      r: "Entra em outro diretório",
      s: "cd [diretório]",
      pos: ["pasta de destino"],
      esp: {
        "..": "sobe um nível (vai para a pasta pai)",
        "../..": "sobe dois níveis",
        "-": "volta para a pasta anterior, como o botão voltar",
        "~": "vai para a sua pasta home",
        "/": "vai para a raiz do sistema"
      },
      f: {},
      ex: [
        ["cd /var/log", "vai direto para a pasta de logs (caminho absoluto)"],
        ["cd ..", "sobe uma pasta"],
        ["cd -", "volta para onde você estava"],
        ["cd ~", "volta para a sua home (só cd também funciona)"]
      ],
      dica: "Caminho absoluto começa com / e parte da raiz. Relativo parte de onde você está. Aperte Tab para completar nomes."
    },
    {
      c: "mkdir", n: "basico", cat: "Arquivos", nome: "make directory",
      r: "Cria diretórios",
      s: "mkdir [opções] nome...",
      pos: ["nome da pasta a criar"],
      f: {
        "-p": ["parents", "cria as pastas intermediárias que faltarem e não reclama se já existir"],
        "-v": ["verbose", "avisa cada pasta criada"],
        "-m": ["mode", "já cria a pasta com essas permissões", { arg: "modo", fn: "modo" }]
      },
      ex: [
        ["mkdir projetos", "cria a pasta projetos"],
        ["mkdir -p estudos/linux/aula1", "cria a árvore inteira de uma vez"],
        ["mkdir -m 700 secreto", "cria uma pasta que só você acessa"]
      ]
    },
    {
      c: "touch", n: "basico", cat: "Arquivos", nome: "touch (tocar no arquivo)",
      r: "Cria um arquivo vazio ou atualiza a data dele",
      s: "touch [opções] arquivo...",
      pos: ["arquivo a criar ou atualizar"],
      f: {
        "-c": ["no-create", "não cria o arquivo se ele não existir"],
        "-a": ["access", "muda só a data de acesso"],
        "-m": ["modification", "muda só a data de modificação"],
        "-d": ["date", "usa a data informada em vez de agora", { arg: "data" }]
      },
      ex: [
        ["touch notas.txt", "cria notas.txt vazio (ou atualiza a data, se já existe)"],
        ["touch arquivo{1..5}.txt", "cria de arquivo1.txt até arquivo5.txt de uma vez"]
      ]
    },
    {
      c: "cp", n: "basico", cat: "Arquivos", nome: "copy",
      r: "Copia arquivos e diretórios",
      s: "cp [opções] origem destino",
      pos: ["origem (o que copiar)", "destino (para onde)"],
      f: {
        "-r": ["recursive", "copia pastas com tudo que tem dentro"],
        "-R": ["Recursive", "mesmo que -r"],
        "-i": ["interactive", "pergunta antes de sobrescrever"],
        "-v": ["verbose", "mostra cada arquivo copiado"],
        "-p": ["preserve", "mantém permissões, dono e datas"],
        "-a": ["archive", "modo arquivo: recursivo e preserva tudo (bom para backup)"],
        "-u": ["update", "só copia se a origem for mais nova que o destino"],
        "-n": ["no-clobber", "nunca sobrescreve um arquivo que já existe"]
      },
      ex: [
        ["cp relatorio.txt backup/", "copia o arquivo para a pasta backup"],
        ["cp -r fotos/ /mnt/pendrive/", "copia a pasta inteira"],
        ["cp -av site/ site-backup/", "backup fiel, mostrando cada arquivo"]
      ]
    },
    {
      c: "mv", n: "basico", cat: "Arquivos", nome: "move",
      r: "Move ou renomeia arquivos",
      s: "mv [opções] origem destino",
      pos: ["origem (o que mover)", "destino (novo lugar ou novo nome)"],
      f: {
        "-i": ["interactive", "pergunta antes de sobrescrever"],
        "-v": ["verbose", "mostra o que foi movido"],
        "-n": ["no-clobber", "nunca sobrescreve um arquivo que já existe"],
        "-f": ["force", "sobrescreve sem perguntar"],
        "-u": ["update", "só move se a origem for mais nova"]
      },
      ex: [
        ["mv rascunho.txt final.txt", "renomeia (no Linux, renomear é mover para o mesmo lugar)"],
        ["mv *.jpg fotos/", "move todos os .jpg para a pasta fotos"],
        ["mv -i config.bak config", "pergunta antes de sobrescrever"]
      ]
    },
    {
      c: "rm", n: "basico", cat: "Arquivos", nome: "remove",
      r: "Apaga arquivos e diretórios (não tem lixeira)",
      s: "rm [opções] arquivo...",
      pos: ["arquivo ou pasta a apagar"],
      f: {
        "-r": ["recursive", "apaga pastas e tudo que tem dentro"],
        "-R": ["Recursive", "mesmo que -r"],
        "-f": ["force", "não pergunta nada e ignora arquivos que não existem"],
        "-i": ["interactive", "pergunta antes de cada remoção"],
        "-I": ["Interactive (uma vez)", "pergunta uma vez só, se for apagar mais de 3 arquivos ou de forma recursiva"],
        "-v": ["verbose", "mostra cada arquivo apagado"],
        "-d": ["dir", "apaga pastas vazias"]
      },
      ex: [
        ["rm arquivo.txt", "apaga um arquivo"],
        ["rm -i *.log", "pergunta um por um antes de apagar"],
        ["rm -rf build/", "apaga a pasta build inteira, sem perguntar"]
      ],
      perigo: "rm não tem lixeira. rm -rf / ou rm -rf ~ apagam o sistema ou a sua home inteira sem pedir confirmação. Confira o caminho antes do Enter."
    },
    {
      c: "cat", n: "basico", cat: "Leitura", nome: "concatenate",
      r: "Mostra o conteúdo de arquivos (e junta vários)",
      s: "cat [opções] arquivo...",
      pos: ["arquivo a mostrar"],
      f: {
        "-n": ["number", "numera todas as linhas"],
        "-b": ["number-nonblank", "numera só as linhas que não estão vazias"],
        "-A": ["show-All", "mostra caracteres invisíveis: tab vira ^I e fim de linha vira $"],
        "-s": ["squeeze-blank", "junta linhas vazias repetidas em uma só"]
      },
      ex: [
        ["cat /etc/os-release", "mostra qual distro você está usando"],
        ["cat -n script.sh", "mostra o arquivo com o número das linhas"],
        ["cat parte1.txt parte2.txt > completo.txt", "junta dois arquivos em um (daí o nome concatenar)"]
      ],
      dica: "Para arquivos grandes use o less: o cat despeja tudo de uma vez na tela."
    },
    {
      c: "less", n: "basico", cat: "Leitura", nome: "less is more (versão melhorada do antigo more)",
      r: "Lê arquivos página por página",
      s: "less [opções] arquivo",
      pos: ["arquivo a ler"],
      f: {
        "-N": ["LINE-NUMBERS", "mostra o número das linhas"],
        "-S": ["chop-long-lines", "não quebra linhas compridas (você rola para o lado)"],
        "-i": ["ignore-case", "busca sem diferenciar maiúsculas de minúsculas"]
      },
      ex: [
        ["less /var/log/syslog", "abre o log para ler com calma"],
        ["less -N script.sh", "lê com o número das linhas"],
        ["ps aux | less", "lê a saída de um comando, página por página"]
      ],
      dica: "Dentro do less: /palavra busca, n vai para o próximo resultado, g vai para o início, G para o fim e q sai."
    },
    {
      c: "head", n: "basico", cat: "Leitura", nome: "head (cabeça)",
      r: "Mostra o começo de um arquivo",
      s: "head [opções] arquivo",
      pos: ["arquivo"],
      num: "atalho para -n: mostra as primeiras N linhas",
      f: {
        "-n": ["number of lines", "quantas linhas mostrar (o padrão é 10)", { arg: "N" }],
        "-c": ["characters (bytes)", "quantos bytes mostrar", { arg: "N" }]
      },
      ex: [
        ["head arquivo.csv", "mostra as 10 primeiras linhas"],
        ["head -n 3 /etc/passwd", "as 3 primeiras linhas"],
        ["head -5 notas.txt", "atalho para head -n 5"]
      ]
    },
    {
      c: "tail", n: "basico", cat: "Leitura", nome: "tail (cauda)",
      r: "Mostra o final de um arquivo (e acompanha ao vivo)",
      s: "tail [opções] arquivo",
      pos: ["arquivo"],
      num: "atalho para -n: mostra as últimas N linhas",
      f: {
        "-n": ["number of lines", "quantas linhas mostrar; com + na frente, mostra a partir dessa linha", { arg: "N" }],
        "-f": ["follow", "fica acompanhando e mostra as linhas novas assim que chegam (Ctrl+C sai)"],
        "-F": ["Follow + retry", "como o -f, mas continua mesmo se o arquivo for recriado (rotação de log)"],
        "-c": ["characters (bytes)", "quantos bytes mostrar", { arg: "N" }]
      },
      ex: [
        ["tail -n 50 app.log", "as últimas 50 linhas"],
        ["tail -f /var/log/nginx/access.log", "acompanha os acessos ao vivo"],
        ["tail -n +2 dados.csv", "tudo a partir da linha 2 (pula o cabeçalho)"]
      ]
    },
    {
      c: "echo", n: "basico", cat: "Leitura", nome: "echo (eco)",
      r: "Imprime texto na tela",
      s: "echo [opções] texto",
      pos: ["texto a imprimir"],
      f: {
        "-n": ["no newline", "não pula linha no final"],
        "-e": ["escapes", "interpreta sequências como \\n (quebra de linha) e \\t (tab)"]
      },
      ex: [
        ['echo "Olá, Linux"', "imprime o texto"],
        ["echo $HOME", "mostra o valor da variável HOME"],
        ['echo "nova linha" >> notas.txt', "acrescenta uma linha no fim do arquivo"],
        ['echo -e "nome\\tidade"', "o \\t vira um tab"]
      ]
    },
    {
      c: "man", n: "basico", cat: "Ajuda", nome: "manual",
      r: "Abre o manual de um comando",
      s: "man [seção] comando",
      pos: ["comando que você quer entender"],
      esp: {
        "1": "seção 1 do manual: comandos de usuário",
        "5": "seção 5 do manual: formatos de arquivos de configuração",
        "8": "seção 8 do manual: comandos de administração"
      },
      f: {
        "-k": ["keyword", "busca nos manuais por palavra-chave (igual ao apropos)", { arg: "palavra" }],
        "-f": ["whatis", "mostra a descrição de uma linha do comando (igual ao whatis)"]
      },
      ex: [
        ["man ls", "manual completo do ls"],
        ["man 5 passwd", "manual do arquivo /etc/passwd, não do comando passwd"],
        ["man -k compress", "descobre comandos ligados a compressão"]
      ],
      dica: "Navega igual ao less: /busca e q para sair. Para uma ajuda rápida, tente comando --help."
    },
    {
      c: "history", n: "basico", cat: "Ajuda", nome: "history (histórico)",
      r: "Mostra os comandos que você já digitou",
      s: "history [N]",
      pos: ["quantos comandos recentes mostrar"],
      f: {
        "-c": ["clear", "apaga o histórico da sessão"],
        "-d": ["delete", "apaga uma linha específica do histórico", { arg: "posição" }]
      },
      ex: [
        ["history", "lista o histórico numerado"],
        ["history 20", "só os últimos 20"],
        ["history | grep ssh", "acha aquele comando ssh que você digitou semana passada"]
      ],
      dica: "!! repete o último comando (sudo !! salva vidas), !42 roda o número 42 da lista e Ctrl+R busca no histórico."
    },
    {
      c: "whoami", n: "basico", cat: "Sistema", nome: "who am I (quem sou eu)",
      r: "Mostra com qual usuário você está logado",
      s: "whoami",
      f: {},
      ex: [
        ["whoami", "mostra o seu usuário"],
        ["sudo whoami", "responde root: o sudo roda o comando como superusuário"]
      ],
      dica: "Em CTF e pentest é o primeiro comando depois de conseguir acesso: saber quem você é na máquina."
    },
    {
      c: "uname", n: "basico", cat: "Sistema", nome: "unix name",
      r: "Mostra informações do sistema e do kernel",
      s: "uname [opções]",
      f: {
        "-a": ["all", "mostra tudo de uma vez"],
        "-r": ["kernel-release", "versão do kernel"],
        "-m": ["machine", "arquitetura do processador (x86_64, aarch64...)"],
        "-n": ["nodename", "nome da máquina na rede"],
        "-s": ["kernel-name", "nome do kernel (Linux)"]
      },
      ex: [
        ["uname -a", "tudo sobre o kernel e a máquina"],
        ["uname -r", "só a versão do kernel"]
      ]
    },
    {
      c: "file", n: "basico", cat: "Arquivos", nome: "file (arquivo)",
      r: "Descobre o tipo real de um arquivo",
      s: "file [opções] arquivo...",
      pos: ["arquivo a identificar"],
      f: {
        "-b": ["brief", "mostra só o tipo, sem repetir o nome do arquivo"],
        "-i": ["mime", "mostra o tipo MIME, como image/png"],
        "-L": ["Link (dereference)", "segue links simbólicos"]
      },
      ex: [
        ["file foto.jpg", "confirma se é mesmo uma imagem JPEG"],
        ["file *", "identifica tudo que está na pasta"],
        ["file -i documento", "mostra o tipo MIME"]
      ],
      dica: "No Linux a extensão é só parte do nome. O file olha o conteúdo, então um virus.txt que na verdade é executável não engana ele."
    },

    /* ─────────────────────── INTERMEDIÁRIO ─────────────────────── */
    {
      c: "grep", n: "intermediario", cat: "Busca e texto", nome: "global regular expression print",
      r: "Procura texto dentro de arquivos ou na saída de comandos",
      s: "grep [opções] padrão [arquivo...]",
      pos: ["padrão (o texto ou regex a procurar)", "arquivo ou pasta onde procurar"],
      f: {
        "-i": ["ignore-case", "não diferencia maiúsculas de minúsculas"],
        "-r": ["recursive", "procura em todas as subpastas"],
        "-R": ["Recursive", "recursivo, seguindo links simbólicos"],
        "-n": ["line-number", "mostra o número da linha de cada resultado"],
        "-v": ["invert-match", "inverte: mostra as linhas que NÃO combinam"],
        "-c": ["count", "só conta quantas linhas combinam"],
        "-l": ["files-with-matches", "mostra só o nome dos arquivos que têm o padrão"],
        "-w": ["word", "só palavra inteira (erro não acha erros)"],
        "-E": ["Extended regex", "regex estendida: | + ? ( ) funcionam sem barra"],
        "-o": ["only-matching", "mostra só o trecho que combinou, não a linha toda"],
        "-A": ["After", "mostra N linhas depois de cada resultado", { arg: "N" }],
        "-B": ["Before", "mostra N linhas antes de cada resultado", { arg: "N" }],
        "-C": ["Context", "mostra N linhas antes e depois", { arg: "N" }],
        "-q": ["quiet", "não mostra nada, só devolve sucesso ou erro (útil em scripts)"],
        "--color": ["color", "destaca o trecho encontrado", { arg: "quando" }]
      },
      ex: [
        ['grep -rni "erro" /var/log', "procura erro em todos os logs, ignorando maiúsculas e mostrando a linha"],
        ['grep -v "^#" /etc/ssh/sshd_config', "esconde os comentários e mostra só a configuração ativa"],
        ["ps aux | grep nginx", "filtra a lista de processos"],
        ['grep -c "Failed password" /var/log/auth.log', "conta tentativas de login que falharam"]
      ],
      dica: "^ marca o começo da linha e $ o fim. ^# = linhas que começam com #."
    },
    {
      c: "find", n: "intermediario", cat: "Busca e texto", nome: "find (encontrar)", unico: true,
      r: "Procura arquivos por nome, tipo, tamanho, data, dono ou permissão",
      s: "find [onde] [testes] [ações]",
      pos: ["onde começar a busca (. = pasta atual, / = sistema todo)"],
      f: {
        "-name": ["name", "nome do arquivo; aceita curingas (* e ?) e diferencia maiúsculas", { arg: "padrão" }],
        "-iname": ["insensitive name", "como o -name, mas ignora maiúsculas e minúsculas", { arg: "padrão" }],
        "-type": ["type", "tipo do item", { arg: "tipo", v: { f: "arquivo comum", d: "diretório", l: "link simbólico", s: "socket", b: "dispositivo de bloco (disco)", c: "dispositivo de caractere", p: "pipe nomeado" } }],
        "-size": ["size", "filtra pelo tamanho", { arg: "tamanho", fn: "size" }],
        "-mtime": ["modification time", "dias desde a última modificação", { arg: "dias", fn: "dias" }],
        "-mmin": ["modification minutes", "minutos desde a última modificação", { arg: "minutos", fn: "minutos" }],
        "-user": ["user", "arquivos que pertencem a esse usuário", { arg: "usuário" }],
        "-perm": ["permission", "filtra pela permissão", { arg: "modo", fn: "perm" }],
        "-maxdepth": ["max depth", "até quantos níveis de subpasta descer", { arg: "N" }],
        "-empty": ["empty", "só arquivos ou pastas vazios"],
        "-exec": ["execute", "roda um comando para cada resultado", { ate: true }],
        "-delete": ["delete", "apaga tudo que encontrou (teste antes sem o -delete)"],
        "-print": ["print", "mostra o caminho de cada resultado (é o padrão)"],
        "-print0": ["print + caractere nulo", "separa os resultados com caractere nulo; par do xargs -0, aguenta nomes com espaço"],
        "-o": ["or", "OU lógico entre dois testes"],
        "-not": ["not", "nega o teste seguinte"]
      },
      ex: [
        ['find . -name "*.log"', "todos os .log a partir da pasta atual"],
        ["find / -type f -size +100M 2>/dev/null", "arquivos com mais de 100 MiB, escondendo os erros de permissão"],
        ["find /home -mtime -1", "o que foi modificado nas últimas 24 horas"],
        ["find / -perm -4000 -type f 2>/dev/null", "binários com SUID, clássico de escalada de privilégio"],
        ['find . -name "*.tmp" -exec rm {} \\;', "apaga cada .tmp encontrado"]
      ],
      dica: "No find os testes usam um traço só e o nome inteiro (-name, -type). Não dá para juntar letras como no ls."
    },
    {
      c: "chmod", n: "intermediario", cat: "Permissões", nome: "change mode", especial: "chmod",
      r: "Muda as permissões de arquivos",
      s: "chmod [opções] modo arquivo...",
      pos: ["modo (as permissões)", "arquivo"],
      f: {
        "-R": ["Recursive", "aplica em todas as subpastas e arquivos"],
        "-v": ["verbose", "mostra cada arquivo processado"],
        "-c": ["changes", "avisa só quando alguma permissão mudou"]
      },
      ex: [
        ["chmod +x script.sh", "deixa o script executável"],
        ["chmod 755 script.sh", "dono faz tudo; grupo e outros leem e executam"],
        ["chmod 600 ~/.ssh/id_ed25519", "chave privada só para você (o ssh exige isso)"],
        ["chmod u+x,go-w deploy.sh", "dono ganha execução; grupo e outros perdem escrita"]
      ],
      dica: "r = 4, w = 2, x = 1. Some por grupo: 7 = rwx, 6 = rw-, 5 = r-x, 4 = r--. Os três dígitos são dono, grupo e outros.",
      perigo: "chmod -R 777 libera tudo para todo mundo. Resolve o erro de permissão e cria um problema de segurança."
    },
    {
      c: "chown", n: "intermediario", cat: "Permissões", nome: "change owner", especial: "chown",
      r: "Muda o dono (e o grupo) de arquivos",
      s: "chown [opções] dono[:grupo] arquivo...",
      pos: ["novo dono, no formato usuário:grupo", "arquivo"],
      f: {
        "-R": ["Recursive", "aplica em todas as subpastas e arquivos"],
        "-v": ["verbose", "mostra cada arquivo processado"],
        "-h": ["no-dereference", "muda o dono do link em vez do arquivo apontado"]
      },
      ex: [
        ["sudo chown $USER:$USER arquivo.txt", "passa o arquivo para você"],
        ["sudo chown -R www-data:www-data /var/www/site", "entrega o site ao usuário do servidor web"]
      ]
    },
    {
      c: "sudo", n: "intermediario", cat: "Permissões", nome: "superuser do", prefixo: true,
      r: "Roda um comando como root (ou como outro usuário)",
      s: "sudo [opções] comando",
      f: {
        "-u": ["user", "roda como esse usuário em vez de root", { arg: "usuário" }],
        "-i": ["login shell", "abre um shell de login como root"],
        "-s": ["shell", "abre um shell como root mantendo o seu ambiente"],
        "-l": ["list", "lista o que você pode rodar com sudo"],
        "-k": ["reset-timestamp", "esquece a senha digitada; pede de novo na próxima vez"],
        "-E": ["Environment", "mantém as suas variáveis de ambiente"]
      },
      ex: [
        ["sudo apt update", "roda o apt como root"],
        ["sudo -l", "mostra o que o seu usuário pode rodar como root (primeira olhada em escalada de privilégio)"],
        ["sudo -u www-data whoami", "roda o whoami como o usuário www-data"],
        ["sudo !!", "repete o último comando, agora com sudo"]
      ],
      dica: "\"Com grandes poderes vêm grandes responsabilidades\" é, literalmente, o aviso que o sudo mostra no primeiro uso."
    },
    {
      c: "wc", n: "intermediario", cat: "Busca e texto", nome: "word count",
      r: "Conta linhas, palavras e bytes",
      s: "wc [opções] arquivo",
      pos: ["arquivo"],
      f: {
        "-l": ["lines", "conta linhas"],
        "-w": ["words", "conta palavras"],
        "-c": ["characters (bytes)", "conta bytes"],
        "-m": ["chars", "conta caracteres (letra acentuada conta como 1)"]
      },
      ex: [
        ["wc -l /etc/passwd", "quantas linhas, ou seja, quantos usuários"],
        ["ls | wc -l", "quantos itens tem na pasta"],
        ["wc -w redacao.txt", "quantas palavras tem a redação"]
      ]
    },
    {
      c: "sort", n: "intermediario", cat: "Busca e texto", nome: "sort (ordenar)",
      r: "Ordena linhas",
      s: "sort [opções] arquivo",
      pos: ["arquivo"],
      f: {
        "-n": ["numeric", "ordena como número (10 vem depois de 9)"],
        "-r": ["reverse", "ordem decrescente"],
        "-u": ["unique", "remove linhas repetidas"],
        "-h": ["human-numeric", "entende tamanhos como 2K e 1G"],
        "-k": ["key", "ordena por essa coluna", { arg: "coluna" }],
        "-t": ["field-separator", "caractere que separa as colunas", { arg: "separador" }],
        "-f": ["fold case", "ignora maiúsculas e minúsculas"]
      },
      ex: [
        ["sort nomes.txt", "ordem alfabética"],
        ["sort -n numeros.txt", "ordem numérica"],
        ["du -sh * | sort -h", "pastas da menor para a maior"],
        ["sort -t: -k3 -n /etc/passwd", "ordena usuários pelo UID (3ª coluna, separada por :)"]
      ]
    },
    {
      c: "uniq", n: "intermediario", cat: "Busca e texto", nome: "unique",
      r: "Remove ou conta linhas repetidas que estão em sequência",
      s: "uniq [opções] [arquivo]",
      pos: ["arquivo"],
      f: {
        "-c": ["count", "conta quantas vezes cada linha aparece"],
        "-d": ["duplicated", "mostra só as linhas repetidas"],
        "-u": ["unique", "mostra só as que aparecem uma vez"],
        "-i": ["ignore-case", "ignora maiúsculas e minúsculas"]
      },
      ex: [
        ["sort lista.txt | uniq", "lista sem repetições"],
        ["sort acessos.txt | uniq -c | sort -rn", "ranking: o que mais se repete aparece primeiro"]
      ],
      dica: "O uniq só compara linhas vizinhas. Por isso quase sempre vem depois de um sort."
    },
    {
      c: "cut", n: "intermediario", cat: "Busca e texto", nome: "cut (cortar)",
      r: "Recorta colunas ou caracteres de cada linha",
      s: "cut [opções] arquivo",
      pos: ["arquivo"],
      f: {
        "-d": ["delimiter", "caractere que separa as colunas (o padrão é tab)", { arg: "separador" }],
        "-f": ["fields", "quais colunas pegar: 1, 1,3 ou 2-4", { arg: "campos" }],
        "-c": ["characters", "quais posições de caractere pegar", { arg: "posições" }]
      },
      ex: [
        ["cut -d: -f1 /etc/passwd", "lista só os nomes de usuário"],
        ["cut -d, -f2,4 dados.csv", "colunas 2 e 4 de um CSV"],
        ["cut -c1-10 arquivo.txt", "os 10 primeiros caracteres de cada linha"]
      ]
    },
    {
      c: "ps", n: "intermediario", cat: "Processos", nome: "process status",
      r: "Lista os processos em execução",
      s: "ps [opções]",
      bsd: {
        a: ["all users", "processos de todos os usuários"],
        u: ["user format", "formato com dono, %CPU, %MEM e horário de início"],
        x: ["x (sem terminal)", "inclui processos sem terminal, como os serviços"]
      },
      f: {
        "-e": ["every", "todos os processos"],
        "-f": ["full", "formato completo: UID, PID, PPID e comando"],
        "-u": ["user", "processos desse usuário", { arg: "usuário" }],
        "-p": ["pid", "só esse processo", { arg: "PID" }],
        "--sort": ["sort", "ordena por um campo; com - na frente, decrescente", { arg: "campo" }]
      },
      ex: [
        ["ps aux", "todos os processos, com dono e uso de CPU e memória"],
        ["ps -ef", "mesma ideia, no estilo Unix"],
        ["ps aux --sort=-%mem | head", "os que mais consomem memória"],
        ["ps -u www-data", "processos do usuário do servidor web"]
      ],
      dica: "ps aux não leva traço por tradição do BSD. São dois \"dialetos\": aux (BSD) e -ef (Unix)."
    },
    {
      c: "top", n: "intermediario", cat: "Processos", nome: "table of processes",
      r: "Monitor de processos ao vivo",
      s: "top [opções]",
      f: {
        "-u": ["user", "só processos desse usuário", { arg: "usuário" }],
        "-p": ["pid", "só esses processos", { arg: "PID" }],
        "-d": ["delay", "intervalo de atualização", { arg: "segundos" }],
        "-b": ["batch", "modo texto contínuo, bom para salvar em arquivo"],
        "-n": ["number of iterations", "quantas atualizações antes de sair", { arg: "N" }]
      },
      ex: [
        ["top", "abre o monitor"],
        ["top -u www-data", "só os processos do servidor web"],
        ["top -b -n 1 > snapshot.txt", "tira uma foto dos processos e salva"]
      ],
      dica: "Dentro do top: P ordena por CPU, M por memória, k mata um processo e q sai. O htop é a versão colorida e mais amigável."
    },
    {
      c: "kill", n: "intermediario", cat: "Processos", nome: "kill (matar)",
      r: "Envia um sinal para um processo (geralmente para encerrar)",
      s: "kill [-sinal] PID",
      pos: ["PID do processo (veja com ps ou pgrep)"],
      f: {
        "-9": ["SIGKILL", "mata na hora, sem o processo poder reagir (último recurso)"],
        "-15": ["SIGTERM", "pede educadamente para encerrar (é o padrão)"],
        "-1": ["SIGHUP", "pede para recarregar a configuração (muitos serviços entendem assim)"],
        "-2": ["SIGINT", "o mesmo que apertar Ctrl+C"],
        "-19": ["SIGSTOP", "pausa o processo"],
        "-18": ["SIGCONT", "continua um processo pausado"],
        "-KILL": ["SIGKILL", "mesmo que -9: mata na hora"],
        "-TERM": ["SIGTERM", "mesmo que -15: pede para encerrar"],
        "-HUP": ["SIGHUP", "mesmo que -1: pede para recarregar a configuração"],
        "-l": ["list", "lista todos os sinais"],
        "-s": ["signal", "escolhe o sinal pelo nome", { arg: "sinal" }]
      },
      ex: [
        ["kill 1234", "pede para o processo 1234 encerrar"],
        ["kill -9 1234", "mata o processo 1234 na marra"],
        ["kill -HUP 980", "pede para o serviço recarregar a configuração"],
        ["kill -l", "lista os sinais disponíveis"]
      ],
      dica: "pkill nginx e killall nginx matam pelo nome, sem precisar do PID."
    },
    {
      c: "tar", n: "intermediario", cat: "Arquivos", nome: "tape archive (vem da época das fitas)", bsd: true,
      r: "Empacota e compacta (ou extrai) arquivos",
      s: "tar [opções] arquivo.tar [arquivos...]",
      pos: ["arquivos ou pastas a empacotar"],
      f: {
        "-c": ["create", "cria um pacote novo"],
        "-x": ["eXtract", "extrai o conteúdo do pacote"],
        "-t": ["table of contents", "lista o conteúdo sem extrair"],
        "-v": ["verbose", "mostra cada arquivo processado"],
        "-f": ["file", "nome do pacote; por isso vem por último no grupo, colado no nome do arquivo", { arg: "arquivo.tar" }],
        "-z": ["g[z]ip", "compacta ou descompacta com gzip (.tar.gz)"],
        "-j": ["bzip2", "compacta ou descompacta com bzip2 (.tar.bz2)"],
        "-J": ["xz", "compacta ou descompacta com xz (.tar.xz)"],
        "-C": ["Change directory", "extrai (ou empacota) a partir dessa pasta", { arg: "pasta" }],
        "--exclude": ["exclude", "deixa de fora o que combinar com o padrão", { arg: "padrão" }]
      },
      ex: [
        ["tar -czvf backup.tar.gz documentos/", "cria (c) com gzip (z), mostrando (v), no arquivo (f) backup.tar.gz"],
        ["tar -xzvf backup.tar.gz", "extrai (x) um .tar.gz"],
        ["tar -tzf backup.tar.gz", "espia o conteúdo sem extrair"],
        ["tar -xf pacote.tar.xz -C /opt", "extrai dentro de /opt (o tar detecta a compressão sozinho)"]
      ],
      dica: "Decoreba: c = criar, x = extrair, t = listar. z, j e J dizem o tipo de compressão. O f vai sempre por último, seguido do nome do arquivo."
    },
    {
      c: "ssh", n: "intermediario", cat: "Rede", nome: "secure shell",
      r: "Acessa outra máquina pelo terminal, com conexão criptografada",
      s: "ssh [opções] usuário@servidor [comando]",
      pos: ["destino, no formato usuário@servidor", "comando para rodar lá (opcional)"],
      f: {
        "-p": ["port", "porta do servidor SSH (o padrão é 22)", { arg: "porta" }],
        "-i": ["identity", "usa essa chave privada", { arg: "chave" }],
        "-L": ["Local forward", "túnel: uma porta local que leva até um destino, passando pelo servidor", { arg: "porta:host:porta" }],
        "-R": ["Remote forward", "túnel reverso: uma porta no servidor que leva até a sua máquina", { arg: "porta:host:porta" }],
        "-D": ["Dynamic", "cria um proxy SOCKS nessa porta", { arg: "porta" }],
        "-N": ["No command", "não abre shell, só mantém o túnel"],
        "-v": ["verbose", "mostra o passo a passo da conexão (ótimo para achar problemas)"],
        "-X": ["X11", "encaminha janelas gráficas"],
        "-J": ["Jump", "passa por um servidor intermediário (bastion)", { arg: "host" }]
      },
      ex: [
        ["ssh ana@192.168.0.10", "conecta como ana nessa máquina"],
        ["ssh -p 2222 ana@servidor.com", "conecta numa porta diferente"],
        ["ssh -i ~/.ssh/aws.pem ubuntu@3.80.10.5", "conecta usando uma chave específica"],
        ["ssh -L 8080:localhost:80 ana@servidor", "acessa a porta 80 do servidor pelo seu localhost:8080"]
      ]
    },
    {
      c: "scp", n: "intermediario", cat: "Rede", nome: "secure copy",
      r: "Copia arquivos entre máquinas pelo SSH",
      s: "scp [opções] origem destino",
      pos: ["origem (local ou usuário@host:caminho)", "destino"],
      f: {
        "-r": ["recursive", "copia pastas inteiras"],
        "-P": ["Port", "porta do SSH; aqui o P é maiúsculo!", { arg: "porta" }],
        "-i": ["identity", "usa essa chave privada", { arg: "chave" }],
        "-C": ["Compression", "comprime durante a transferência"],
        "-v": ["verbose", "mostra detalhes da conexão"]
      },
      ex: [
        ["scp relatorio.pdf ana@servidor:/home/ana/", "envia um arquivo"],
        ["scp -r ana@servidor:/var/log/app ./logs", "baixa uma pasta inteira do servidor"],
        ["scp -P 2222 arquivo.txt ana@servidor:~", "envia usando outra porta"]
      ],
      dica: "Pegadinha clássica: ssh usa -p minúsculo para a porta, scp usa -P maiúsculo."
    },
    {
      c: "apt", n: "intermediario", cat: "Pacotes e serviços", nome: "Advanced Package Tool",
      r: "Instala, atualiza e remove programas (Debian e Ubuntu)",
      s: "apt [opções] subcomando [pacotes]",
      pos: ["subcomando", "nome do pacote"],
      sub: {
        update: "baixa a lista atualizada de pacotes (não instala nada)",
        upgrade: "atualiza os pacotes instalados",
        "full-upgrade": "atualiza tudo, removendo pacotes se precisar",
        install: "instala pacotes",
        remove: "remove o pacote, mas mantém as configurações",
        purge: "remove o pacote e as configurações",
        autoremove: "remove dependências que ninguém usa mais",
        search: "procura pacotes pelo nome ou descrição",
        show: "mostra detalhes de um pacote",
        list: "lista pacotes"
      },
      f: {
        "-y": ["yes", "responde sim automaticamente"],
        "--installed": ["installed", "com list, mostra só os instalados"],
        "--upgradable": ["upgradable", "com list, mostra só os que têm atualização"]
      },
      ex: [
        ["sudo apt update && sudo apt upgrade -y", "atualiza a lista e depois tudo que está instalado"],
        ["sudo apt install htop", "instala o htop"],
        ['apt search "network scanner"', "procura pacotes de scanner de rede"],
        ["sudo apt purge apache2 && sudo apt autoremove", "remove o Apache e o que sobrou"]
      ],
      dica: "update atualiza a LISTA, upgrade atualiza os PROGRAMAS. No Fedora o equivalente é o dnf; no Arch, o pacman."
    },
    {
      c: "systemctl", n: "intermediario", cat: "Pacotes e serviços", nome: "system control",
      r: "Controla serviços do systemd: iniciar, parar e ligar no boot",
      s: "systemctl [opções] subcomando [serviço]",
      pos: ["subcomando", "nome do serviço (ex.: ssh, nginx)"],
      sub: {
        status: "mostra se o serviço está rodando e as últimas linhas de log",
        start: "inicia o serviço",
        stop: "para o serviço",
        restart: "reinicia o serviço",
        reload: "recarrega a configuração sem derrubar o serviço",
        enable: "liga o serviço junto com o sistema",
        disable: "não liga mais no boot",
        "is-active": "responde só active ou inactive",
        "is-enabled": "responde se liga no boot",
        "list-units": "lista as unidades carregadas",
        "daemon-reload": "relê os arquivos de serviço depois que você edita um"
      },
      f: {
        "--now": ["now", "com enable ou disable, também inicia ou para na hora"],
        "--type": ["type", "filtra pelo tipo de unidade", { arg: "tipo", v: { service: "só serviços", timer: "só timers", socket: "só sockets" } }],
        "--failed": ["failed", "só as unidades que falharam"],
        "--user": ["user", "serviços do seu usuário, não do sistema"]
      },
      ex: [
        ["systemctl status ssh", "o SSH está rodando?"],
        ["sudo systemctl restart nginx", "reinicia o nginx"],
        ["sudo systemctl enable --now docker", "liga o Docker agora e em todo boot"],
        ["systemctl list-units --type=service --failed", "quais serviços quebraram?"]
      ]
    },
    {
      c: "df", n: "intermediario", cat: "Disco", nome: "disk free",
      r: "Mostra o espaço livre nos discos",
      s: "df [opções] [caminho]",
      pos: ["caminho (mostra o disco onde ele está)"],
      f: {
        "-h": ["human-readable", "tamanhos legíveis (K, M, G)"],
        "-T": ["Type", "mostra o tipo do sistema de arquivos (ext4, xfs...)"],
        "-i": ["inodes", "mostra inodes em vez de bytes"],
        "-x": ["exclude type", "esconde esse tipo de sistema de arquivos", { arg: "tipo" }]
      },
      ex: [
        ["df -h", "espaço de todos os discos"],
        ["df -hT /", "espaço e tipo do disco raiz"],
        ["df -i", "disco \"cheio\" com espaço sobrando? Podem ser os inodes"]
      ]
    },
    {
      c: "du", n: "intermediario", cat: "Disco", nome: "disk usage",
      r: "Mostra quanto espaço arquivos e pastas ocupam",
      s: "du [opções] [caminho...]",
      pos: ["pasta ou arquivo a medir"],
      f: {
        "-s": ["summarize", "mostra só o total de cada item"],
        "-h": ["human-readable", "tamanhos legíveis (K, M, G)"],
        "-a": ["all", "inclui arquivos, não só pastas"],
        "-c": ["total", "soma tudo no final"],
        "-d": ["depth", "até quantos níveis de subpasta mostrar", { arg: "N" }],
        "--max-depth": ["max depth", "até quantos níveis de subpasta mostrar", { arg: "N" }]
      },
      ex: [
        ["du -sh *", "quanto ocupa cada coisa na pasta atual"],
        ["du -h -d 1 /var | sort -h", "quais subpastas de /var pesam mais"],
        ["du -sh ~/Downloads", "o tamanho da pasta Downloads"]
      ],
      dica: "Disco cheio? df -h mostra QUAL disco; du -sh * mostra QUEM está ocupando."
    },
    {
      c: "ln", n: "intermediario", cat: "Arquivos", nome: "link",
      r: "Cria links (atalhos) para arquivos",
      s: "ln [opções] alvo nome_do_link",
      pos: ["alvo (o arquivo original)", "nome do link a criar"],
      f: {
        "-s": ["symbolic", "cria link simbólico (atalho); sem ele, cria hard link"],
        "-f": ["force", "substitui o link se ele já existir"],
        "-v": ["verbose", "mostra o link criado"],
        "-n": ["no-dereference", "trata um link para pasta como arquivo comum"]
      },
      ex: [
        ["ln -s ~/projetos/app/app.sh ~/bin/app", "atalho para rodar o script de qualquer lugar"],
        ["ln -sf /etc/nginx/sites-available/site /etc/nginx/sites-enabled/site", "ativa um site no nginx"]
      ]
    },
    {
      c: "curl", n: "intermediario", cat: "Rede", nome: "client URL",
      r: "Faz requisições HTTP (e de outros protocolos) pelo terminal",
      s: "curl [opções] URL",
      pos: ["URL"],
      f: {
        "-O": ["remote-name", "salva com o nome original do arquivo"],
        "-o": ["output", "salva com esse nome", { arg: "arquivo" }],
        "-L": ["Location", "segue redirecionamentos"],
        "-I": ["head", "mostra só os cabeçalhos da resposta"],
        "-i": ["include", "mostra cabeçalhos e corpo"],
        "-s": ["silent", "esconde a barra de progresso e mensagens"],
        "-S": ["Show-error", "com -s, ainda mostra os erros"],
        "-X": ["request method", "método HTTP: GET, POST, PUT, DELETE", { arg: "método" }],
        "-H": ["Header", "adiciona um cabeçalho", { arg: "cabeçalho" }],
        "-d": ["data", "corpo da requisição (já transforma em POST)", { arg: "dados" }],
        "-v": ["verbose", "mostra toda a conversa com o servidor"],
        "-k": ["insecure", "ignora erro de certificado; só para testes"],
        "-u": ["user", "usuário e senha para autenticação básica", { arg: "usuário:senha" }]
      },
      ex: [
        ["curl -I https://exemplo.com", "vê só os cabeçalhos da resposta"],
        ["curl -sL https://ifconfig.me", "descobre o seu IP público"],
        ["curl -L -o node.tar.xz https://nodejs.org/dist/latest/node.tar.xz", "baixa um arquivo com outro nome"],
        [`curl -X POST -H "Content-Type: application/json" -d '{"nome":"ana"}' http://localhost:8080/api`, "envia um JSON para uma API"]
      ]
    },
    {
      c: "crontab", n: "intermediario", cat: "Pacotes e serviços", nome: "cron table (cron vem de chronos, tempo em grego)",
      r: "Agenda comandos para rodar automaticamente",
      s: "crontab [opções]",
      f: {
        "-e": ["edit", "edita os seus agendamentos"],
        "-l": ["list", "lista os seus agendamentos"],
        "-r": ["remove", "apaga TODOS os seus agendamentos, sem perguntar"],
        "-u": ["user", "mexe nos agendamentos de outro usuário", { arg: "usuário" }]
      },
      ex: [
        ["crontab -e", "abre o editor para criar ou mudar agendamentos"],
        ["crontab -l", "lista o que está agendado"],
        ["sudo crontab -u www-data -l", "agendamentos do usuário www-data"]
      ],
      dica: "Formato da linha: minuto hora dia mês dia-da-semana comando. Exemplo: 0 3 * * * /home/ana/backup.sh roda todo dia às 3h.",
      perigo: "O -r fica do lado do -e no teclado e apaga tudo sem confirmação."
    },
    {
      c: "ping", n: "intermediario", cat: "Rede", nome: "ping (o som do sonar)",
      r: "Testa se uma máquina responde na rede",
      s: "ping [opções] destino",
      pos: ["endereço ou IP"],
      f: {
        "-c": ["count", "envia N pacotes e para; sem isso, vai até o Ctrl+C", { arg: "N" }],
        "-i": ["interval", "intervalo entre pacotes", { arg: "segundos" }],
        "-W": ["Wait", "quanto esperar por cada resposta", { arg: "segundos" }],
        "-4": ["IPv4", "força IPv4"],
        "-6": ["IPv6", "força IPv6"],
        "-q": ["quiet", "mostra só o resumo final"]
      },
      ex: [
        ["ping -c 4 google.com", "4 pings e o resumo"],
        ["ping -c 3 192.168.0.1", "o roteador está vivo?"]
      ]
    },
    {
      c: "ip", n: "intermediario", cat: "Rede", nome: "ip (internet protocol)",
      r: "Mostra e configura a rede: endereços, rotas e interfaces",
      s: "ip [opções] objeto [ação]",
      pos: ["objeto", "detalhe"],
      sub: {
        a: "address: endereços IP das interfaces",
        addr: "address: endereços IP das interfaces",
        address: "endereços IP das interfaces",
        r: "route: tabela de rotas (por onde o tráfego sai)",
        route: "tabela de rotas (por onde o tráfego sai)",
        link: "interfaces de rede (ligar, desligar, ver o MAC)",
        neigh: "vizinhos na rede local (a tabela ARP)"
      },
      esp: {
        show: "mostra",
        add: "adiciona",
        del: "remove",
        set: "altera uma configuração",
        up: "liga a interface",
        down: "desliga a interface",
        dev: "a próxima palavra é o nome da interface"
      },
      f: {
        "-br": ["brief", "saída resumida, uma linha por interface"],
        "-c": ["color", "saída colorida"],
        "-4": ["IPv4", "só IPv4"],
        "-6": ["IPv6", "só IPv6"],
        "-s": ["statistics", "mostra estatísticas de tráfego"]
      },
      ex: [
        ["ip a", "os seus IPs (como o ipconfig do Windows)"],
        ["ip -br a", "versão resumida"],
        ["ip r", "rota padrão e gateway"],
        ["sudo ip link set eth0 down", "desliga a interface eth0"]
      ]
    },

    /* ───────────────────────── AVANÇADO ───────────────────────── */
    {
      c: "awk", n: "avancado", cat: "Busca e texto", nome: "Aho, Weinberger e Kernighan (os criadores)", especial: "awk",
      r: "Linguagem para processar texto coluna por coluna",
      s: "awk [opções] 'programa' [arquivo...]",
      pos: ["programa awk (entre aspas simples)", "arquivo"],
      f: {
        "-F": ["Field separator", "o que separa as colunas (o padrão são espaços)", { arg: "separador" }],
        "-v": ["variable", "cria uma variável para o programa", { arg: "var=valor" }]
      },
      ex: [
        ["awk -F: '{print $1}' /etc/passwd", "primeira coluna: os usuários"],
        ["awk '{print $1}' access.log | sort | uniq -c | sort -rn | head", "os IPs que mais acessaram o site"],
        ["df -h | awk '$5+0 > 80'", "discos com mais de 80% de uso"],
        ["awk '{soma += $2} END {print soma}' vendas.txt", "soma a segunda coluna"]
      ],
      dica: "$1 é a primeira coluna, $NF a última, $0 a linha inteira e NR o número da linha."
    },
    {
      c: "sed", n: "avancado", cat: "Busca e texto", nome: "stream editor", especial: "sed",
      r: "Edita texto em fluxo: substitui, apaga e filtra linhas",
      s: "sed [opções] 'script' [arquivo...]",
      pos: ["script do sed", "arquivo"],
      f: {
        "-i": ["in-place", "altera o arquivo de verdade; sem isso, só mostra o resultado na tela", { arg: "sufixo do backup", colado: true }],
        "-n": ["no auto-print", "não imprime nada sozinho; use junto com o comando p"],
        "-e": ["expression", "o script vem logo depois", { arg: "script", fn: "sed" }],
        "-E": ["Extended regex", "regex estendida"],
        "-r": ["regexp-extended", "regex estendida (forma antiga do -E)"]
      },
      ex: [
        ["sed 's/http:/https:/g' links.txt", "troca http: por https: em todas as linhas"],
        ["sed -i 's/8080/9090/' config.ini", "troca a porta direto no arquivo"],
        ["sed -n '10,20p' log.txt", "só as linhas 10 a 20"],
        ["sed '/^#/d' nginx.conf", "remove as linhas de comentário"],
        ["sed -i.bak 's/debug=true/debug=false/' app.conf", "edita e guarda o original como app.conf.bak"]
      ],
      dica: "Rode sem o -i primeiro para ver o resultado. Quando estiver certo, aí sim grave no arquivo."
    },
    {
      c: "xargs", n: "avancado", cat: "Busca e texto", nome: "extended arguments", prefixo: true,
      r: "Transforma a saída de um comando em argumentos de outro",
      s: "comando | xargs [opções] outro_comando",
      f: {
        "-n": ["number of args", "passa N argumentos por vez", { arg: "N" }],
        "-I": ["replace-str", "troca o marcador (geralmente {}) por cada item", { arg: "marcador" }],
        "-0": ["null", "itens separados por caractere nulo; par do find -print0, aguenta espaços"],
        "-P": ["max-Procs", "roda N comandos em paralelo", { arg: "N" }],
        "-p": ["prompt", "pergunta antes de cada execução"],
        "-t": ["verbose", "mostra cada comando antes de rodar"]
      },
      ex: [
        ['find . -name "*.log" | xargs rm', "apaga todos os .log encontrados"],
        ['find . -name "*.jpg" -print0 | xargs -0 -I {} cp {} fotos/', "copia cada foto, mesmo com espaço no nome"],
        ["cat urls.txt | xargs -n 1 -P 4 curl -sO", "baixa 4 URLs ao mesmo tempo"]
      ]
    },
    {
      c: "tee", n: "avancado", cat: "Busca e texto", nome: "tee (a conexão em T do encanamento)",
      r: "Mostra a saída na tela e salva em arquivo ao mesmo tempo",
      s: "comando | tee [opções] arquivo",
      pos: ["arquivo de destino"],
      f: {
        "-a": ["append", "acrescenta no fim em vez de sobrescrever"]
      },
      ex: [
        ["./instalar.sh | tee instalacao.log", "acompanha a instalação e guarda o log"],
        ['echo "127.0.0.1 meusite.local" | sudo tee -a /etc/hosts', "escreve num arquivo do root (sudo echo > não funciona)"]
      ]
    },
    {
      c: "lsof", n: "avancado", cat: "Processos", nome: "list open files",
      r: "Mostra arquivos e conexões abertos por processos",
      s: "lsof [opções] [arquivo]",
      pos: ["arquivo (mostra quem está com ele aberto)"],
      f: {
        "-i": ["internet", "conexões de rede; aceita um filtro como :80", { arg: "endereço", opc: /^[:@]|^(tcp|udp|4|6)/i }],
        "-p": ["pid", "arquivos abertos por esse processo", { arg: "PID" }],
        "-u": ["user", "arquivos abertos por esse usuário", { arg: "usuário" }],
        "-n": ["no host names", "não resolve nomes de host (mais rápido)"],
        "-P": ["Port numbers", "mostra portas em número (80 em vez de http)"]
      },
      ex: [
        ["sudo lsof -i :8080", "quem está usando a porta 8080?"],
        ["sudo lsof -nP -i", "todas as conexões de rede, só com números"],
        ["lsof /var/log/syslog", "quem está com esse arquivo aberto"]
      ],
      dica: "No Linux tudo é arquivo, inclusive conexões de rede. Por isso o lsof enxerga tanta coisa."
    },
    {
      c: "ss", n: "avancado", cat: "Rede", nome: "socket statistics",
      r: "Mostra conexões e portas abertas",
      s: "ss [opções] [filtro]",
      pos: ["filtro"],
      esp: {
        state: "filtra pelo estado da conexão",
        established: "conexão ativa",
        listening: "esperando conexão"
      },
      f: {
        "-t": ["tcp", "mostra conexões TCP"],
        "-u": ["udp", "mostra conexões UDP"],
        "-l": ["listening", "só portas esperando conexão"],
        "-n": ["numeric", "mostra números em vez de nomes (22 em vez de ssh)"],
        "-p": ["processes", "mostra qual processo usa a porta (com sudo, vê de todos)"],
        "-a": ["all", "todas: esperando e conectadas"],
        "-s": ["summary", "resumo estatístico"],
        "-4": ["IPv4", "só IPv4"],
        "-6": ["IPv6", "só IPv6"]
      },
      ex: [
        ["sudo ss -tulnp", "o clássico: portas TCP e UDP abertas, em número, com o processo dono"],
        ["ss -tn state established", "conexões TCP ativas agora"],
        ["ss -s", "resumo de todas as conexões"]
      ],
      dica: "É o substituto moderno do netstat. Decoreba: tulnp = TCP, UDP, Listening, Numeric, Process."
    },
    {
      c: "strace", n: "avancado", cat: "Processos", nome: "system call trace", prefixo: true,
      r: "Espiona as chamadas de sistema que um programa faz",
      s: "strace [opções] comando",
      f: {
        "-p": ["pid", "conecta num processo que já está rodando", { arg: "PID" }],
        "-f": ["follow forks", "acompanha também os processos filhos"],
        "-e": ["expression", "filtra quais chamadas mostrar (ex.: trace=openat)", { arg: "filtro" }],
        "-o": ["output", "salva a saída em arquivo", { arg: "arquivo" }],
        "-c": ["count", "resumo: quantas vezes cada chamada aconteceu e quanto tempo levou"],
        "-t": ["time", "mostra o horário de cada chamada"],
        "-s": ["string size", "tamanho máximo dos textos exibidos", { arg: "N" }]
      },
      ex: [
        ["strace ls", "tudo que o ls pede ao kernel"],
        ["strace -e trace=openat cat /etc/hostname", "quais arquivos o programa abre"],
        ["sudo strace -f -p 1234", "espia um processo em execução"],
        ["strace -c curl -s https://exemplo.com", "estatística das chamadas"]
      ]
    },
    {
      c: "journalctl", n: "avancado", cat: "Pacotes e serviços", nome: "journal control",
      r: "Lê os logs do systemd",
      s: "journalctl [opções]",
      f: {
        "-u": ["unit", "logs só desse serviço", { arg: "serviço" }],
        "-f": ["follow", "acompanha ao vivo"],
        "-n": ["number of lines", "as últimas N linhas", { arg: "N" }],
        "-e": ["end", "abre já no final"],
        "-x": ["catalog", "adiciona explicações extras às mensagens"],
        "-b": ["boot", "só desde o último boot"],
        "-k": ["kernel", "só mensagens do kernel (igual ao dmesg)"],
        "-p": ["priority", "só mensagens dessa gravidade para cima", { arg: "nível", v: { emerg: "emergência: sistema inutilizável", alert: "alerta: ação imediata", crit: "crítico", err: "erros", warning: "avisos", notice: "normal, mas relevante", info: "informativo", debug: "depuração" } }],
        "--since": ["since", "desde quando (ex.: \"1 hour ago\", \"2026-11-01\")", { arg: "quando" }],
        "--until": ["until", "até quando", { arg: "quando" }],
        "--no-pager": ["no pager", "despeja tudo sem abrir no less"]
      },
      ex: [
        ["journalctl -u ssh -f", "acompanha o log do SSH ao vivo"],
        ["journalctl -p err -b", "só os erros desde o último boot"],
        ['journalctl --since "1 hour ago"', "tudo da última hora"],
        ["journalctl -xe", "o clássico quando um serviço não sobe"]
      ]
    },
    {
      c: "nc", n: "avancado", cat: "Segurança", nome: "netcat", alias: ["netcat", "ncat"],
      r: "Canivete suíço de rede: conecta, escuta e transfere dados por TCP e UDP",
      s: "nc [opções] host porta",
      pos: ["host", "porta"],
      f: {
        "-l": ["listen", "escuta esperando conexão (vira servidor)"],
        "-v": ["verbose", "mostra o que está acontecendo"],
        "-n": ["numeric", "não resolve DNS; usa só IP"],
        "-z": ["zero I/O", "só testa se a porta está aberta, sem enviar dados (scan)"],
        "-p": ["port", "porta local", { arg: "porta" }],
        "-u": ["udp", "usa UDP em vez de TCP"],
        "-w": ["wait", "tempo limite", { arg: "segundos" }],
        "-k": ["keep-open", "continua escutando depois que a conexão fecha"]
      },
      ex: [
        ["nc -zv localhost 8080", "testa se a porta 8080 está aberta (o mesmo teste do README do Vulnado)"],
        ["nc -zv 192.168.0.10 20-25", "verifica as portas 20 a 25"],
        ["nc -lvnp 4444", "escuta na porta 4444: é o lado que espera a conexão no exercício de reverse shell"],
        ["nc -lvnp 9000 > recebido.txt", "recebe um arquivo pela rede"]
      ],
      perigo: "Escanear ou conectar em máquinas de terceiros sem autorização é crime. Pratique no seu laboratório, como o docker-compose do Vulnado."
    },
    {
      c: "tcpdump", n: "avancado", cat: "Segurança", nome: "TCP dump (despejo de pacotes)",
      r: "Captura e mostra pacotes de rede",
      s: "sudo tcpdump [opções] [filtro]",
      pos: ["filtro de captura"],
      esp: {
        port: "filtra por porta",
        host: "filtra por IP ou nome de máquina",
        src: "só o que vem dessa origem",
        dst: "só o que vai para esse destino",
        net: "filtra por rede (ex.: 192.168.0.0/24)",
        tcp: "só TCP",
        udp: "só UDP",
        icmp: "só ICMP (o protocolo do ping)",
        and: "E: as duas condições",
        or: "OU: qualquer uma das condições",
        not: "NÃO: inverte a condição"
      },
      f: {
        "-i": ["interface", "em qual placa de rede escutar", { arg: "interface", v: { any: "todas as interfaces", lo: "loopback, o tráfego interno da máquina (localhost)" } }],
        "-n": ["numeric", "não resolve nomes"],
        "-nn": ["numeric numeric", "não resolve nem nomes nem portas"],
        "-c": ["count", "para depois de N pacotes", { arg: "N" }],
        "-w": ["write", "salva a captura em arquivo (abre no Wireshark)", { arg: "arquivo.pcap" }],
        "-r": ["read", "lê uma captura salva", { arg: "arquivo.pcap" }],
        "-A": ["ASCII", "mostra o conteúdo dos pacotes em texto"],
        "-X": ["heX", "mostra o conteúdo em hexadecimal e texto"],
        "-v": ["verbose", "mais detalhes de cada pacote"],
        "-D": ["list-interfaces (D de Devices)", "lista as interfaces disponíveis"]
      },
      ex: [
        ["sudo tcpdump -i eth0 -n port 80", "tráfego HTTP na eth0"],
        ["sudo tcpdump -i any -c 20 icmp", "captura 20 pacotes de ping"],
        ["sudo tcpdump -i eth0 -w captura.pcap", "salva para analisar no Wireshark"],
        ["sudo tcpdump -A -i lo port 8080", "lê o tráfego HTTP local em texto puro"]
      ],
      perigo: "Capturar tráfego de redes que não são suas, sem autorização, é ilegal."
    },
    {
      c: "dd", n: "avancado", cat: "Disco", nome: "data duplicator (apelido: disk destroyer)",
      r: "Copia dados bloco a bloco: gravar ISO em pendrive, clonar disco",
      s: "dd if=origem of=destino [opções]",
      kv: {
        "if": "input file: de onde ler",
        of: "output file: onde escrever",
        bs: "block size: tamanho de cada bloco (ex.: 4M)",
        count: "quantos blocos copiar",
        status: "status=progress mostra o andamento",
        conv: "conversões; fsync garante que tudo foi gravado antes de terminar",
        skip: "pula N blocos da entrada",
        seek: "pula N blocos da saída",
        oflag: "flags da saída (ex.: sync, direct)"
      },
      f: {},
      ex: [
        ["sudo dd if=ubuntu.iso of=/dev/sdb bs=4M status=progress conv=fsync", "grava a ISO no pendrive"],
        ["dd if=/dev/zero of=teste.img bs=1M count=100", "cria um arquivo de 100 MiB cheio de zeros"],
        ["sudo dd if=/dev/sda of=mbr.bak bs=512 count=1", "backup do setor de boot"]
      ],
      perigo: "Um of= errado (/dev/sda em vez de /dev/sdb) apaga o disco errado. Sem pergunta e sem desfazer. Confira com lsblk antes."
    },
    {
      c: "rsync", n: "avancado", cat: "Arquivos", nome: "remote sync",
      r: "Sincroniza arquivos (local ou remoto), copiando só o que mudou",
      s: "rsync [opções] origem destino",
      pos: ["origem (com / no final copia o conteúdo; sem /, copia a pasta)", "destino"],
      f: {
        "-a": ["archive", "modo arquivo: recursivo e preserva permissões, datas e links"],
        "-r": ["recursive", "entra nas subpastas"],
        "-v": ["verbose", "mostra cada arquivo"],
        "-z": ["compress (z de zip)", "comprime durante a transferência"],
        "-h": ["human-readable", "números legíveis"],
        "-P": ["Progress + Partial", "mostra o progresso e retoma transferências interrompidas"],
        "-n": ["dry-run", "simula sem copiar nada"],
        "-e": ["rsh (remote shell)", "como conectar (ex.: \"ssh -p 2222\")", { arg: "comando" }],
        "--delete": ["delete", "apaga no destino o que não existe mais na origem"],
        "--exclude": ["exclude", "deixa de fora o que combinar com o padrão", { arg: "padrão" }]
      },
      ex: [
        ["rsync -avh fotos/ /mnt/backup/fotos/", "backup local"],
        ["rsync -avzP projeto/ ana@servidor:/srv/projeto/", "envia para o servidor, comprimindo e mostrando o progresso"],
        ["rsync -avn --delete origem/ destino/", "simula o espelhamento antes de fazer de verdade"]
      ],
      perigo: "--delete com origem e destino trocados apaga os seus arquivos. Rode com -n primeiro."
    },
    {
      c: "iptables", n: "avancado", cat: "Segurança", nome: "IP tables (tabelas de regras)",
      r: "Firewall do Linux: decide quais pacotes passam e quais são bloqueados",
      s: "iptables [opções]",
      pos: ["alvo"],
      f: {
        "-L": ["List", "lista as regras", { arg: "chain", opc: /^[A-Z]+$/ }],
        "-n": ["numeric", "mostra IPs e portas em número"],
        "-v": ["verbose", "mostra contadores de pacotes e bytes"],
        "-A": ["Append", "adiciona a regra no fim da chain", { arg: "chain", v: { INPUT: "pacotes chegando nesta máquina", OUTPUT: "pacotes saindo desta máquina", FORWARD: "pacotes passando por esta máquina (modo roteador)" } }],
        "-I": ["Insert", "insere a regra no topo da chain", { arg: "chain", v: { INPUT: "pacotes chegando nesta máquina", OUTPUT: "pacotes saindo desta máquina", FORWARD: "pacotes passando por esta máquina (modo roteador)" } }],
        "-D": ["Delete", "remove uma regra da chain", { arg: "chain" }],
        "-p": ["protocol", "protocolo da regra", { arg: "protocolo" }],
        "-s": ["source", "IP de origem", { arg: "IP" }],
        "-d": ["destination", "IP de destino", { arg: "IP" }],
        "--dport": ["destination port", "porta de destino", { arg: "porta" }],
        "--sport": ["source port", "porta de origem", { arg: "porta" }],
        "-j": ["jump", "o que fazer com o pacote", { arg: "alvo", v: { ACCEPT: "deixa passar", DROP: "descarta em silêncio", REJECT: "recusa e avisa quem enviou", LOG: "registra no log" } }],
        "-F": ["Flush", "apaga todas as regras"],
        "-P": ["Policy", "política padrão da chain (o que acontece se nenhuma regra combinar)", { arg: "chain" }],
        "--line-numbers": ["line numbers", "numera as regras (útil para apagar pelo número)"]
      },
      ex: [
        ["sudo iptables -L -n -v", "todas as regras, com contadores"],
        ["sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT", "libera o SSH"],
        ["sudo iptables -A INPUT -s 203.0.113.50 -j DROP", "bloqueia um IP"],
        ["sudo iptables -L INPUT --line-numbers", "regras de entrada numeradas"]
      ],
      dica: "Distros novas usam o nftables (comando nft) por baixo, e o ufw é uma interface mais simples. O iptables continua muito usado e cobrado.",
      perigo: "-F ou uma política DROP na INPUT pode te trancar fora do servidor pelo SSH. Libere o SSH antes."
    },
    {
      c: "watch", n: "avancado", cat: "Processos", nome: "watch (vigiar)", prefixo: true,
      r: "Repete um comando a cada N segundos e mostra o resultado em tela cheia",
      s: "watch [opções] comando",
      f: {
        "-n": ["interval", "intervalo entre as execuções", { arg: "segundos" }],
        "-d": ["differences", "destaca o que mudou"],
        "-t": ["no-title", "esconde o cabeçalho"]
      },
      ex: [
        ["watch -n 2 df -h", "acompanha o espaço em disco a cada 2 segundos"],
        ["watch -d 'ss -tn'", "acompanha as conexões, destacando mudanças"]
      ]
    },
    {
      c: "ssh-keygen", n: "avancado", cat: "Segurança", nome: "SSH key generator",
      r: "Gera e gerencia chaves SSH",
      s: "ssh-keygen [opções]",
      f: {
        "-t": ["type", "tipo da chave", { arg: "tipo", v: { ed25519: "moderna, curta e segura (recomendada)", rsa: "clássica; use pelo menos 4096 bits", ecdsa: "curva elíptica" } }],
        "-b": ["bits", "tamanho da chave", { arg: "N" }],
        "-C": ["Comment", "comentário para identificar a chave (geralmente usuário@máquina)", { arg: "comentário" }],
        "-f": ["file", "onde salvar a chave", { arg: "arquivo" }],
        "-p": ["passphrase", "troca a senha de uma chave existente"],
        "-l": ["list fingerprint", "mostra a impressão digital (fingerprint) da chave"],
        "-R": ["Remove", "remove um host do known_hosts", { arg: "host" }]
      },
      ex: [
        ['ssh-keygen -t ed25519 -C "ana@notebook"', "cria uma chave moderna"],
        ["ssh-keygen -t rsa -b 4096 -f ~/.ssh/servidor_rsa", "chave RSA de 4096 bits em outro arquivo"],
        ["ssh-keygen -R 192.168.0.10", "resolve o aviso REMOTE HOST IDENTIFICATION HAS CHANGED"]
      ],
      dica: "Depois de gerar, ssh-copy-id ana@servidor envia a sua chave pública e o login passa a dispensar senha."
    }
  ];

  /* Operadores e símbolos do shell */
  global.OPERADORES = {
    "|": ["pipe", "manda a saída do comando da esquerda como entrada do comando da direita"],
    ">": ["redireciona a saída", "salva a saída no arquivo, apagando o que tinha antes"],
    ">>": ["acrescenta", "adiciona a saída no fim do arquivo, sem apagar o que já existe"],
    "<": ["entrada", "usa o arquivo como entrada do comando"],
    "2>": ["redireciona os erros", "manda só as mensagens de erro (stderr) para o arquivo"],
    "2>>": ["acrescenta os erros", "adiciona as mensagens de erro no fim do arquivo"],
    "2>&1": ["junta erros e saída", "manda o stderr (2) para o mesmo lugar do stdout (1)"],
    "&>": ["saída e erros", "manda tudo, saída e erros, para o arquivo"],
    "&>>": ["acrescenta saída e erros", "adiciona saída e erros no fim do arquivo"],
    "&&": ["E", "só roda o próximo comando se o anterior deu certo"],
    "||": ["OU", "só roda o próximo comando se o anterior falhou"],
    ";": ["em sequência", "roda um depois do outro, dando certo ou não"],
    "&": ["segundo plano", "roda em background e devolve o terminal para você"]
  };

  /* Cola de atalhos (só para exibição) */
  global.ATALHOS = [
    ["~", "a sua pasta home"],
    [".", "a pasta atual"],
    ["..", "a pasta de cima"],
    ["*", "curinga: qualquer sequência de caracteres"],
    ["?", "curinga: exatamente um caractere"],
    ["$VAR", "valor de uma variável"],
    ["$(cmd)", "roda cmd e usa a saída dele"],
    ["!!", "repete o último comando"],
    ["Tab", "completa nomes de comandos e arquivos"],
    ["Ctrl+C", "interrompe o comando atual"],
    ["Ctrl+R", "busca no histórico"],
    ["Ctrl+L", "limpa a tela"],
    ["Ctrl+A / Ctrl+E", "vai para o início / fim da linha"],
    ["Ctrl+D", "fecha o terminal (ou a sessão SSH)"]
  ];
})(typeof window !== "undefined" ? window : globalThis);
