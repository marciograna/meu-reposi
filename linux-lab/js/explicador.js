/*
 * Linux Lab: destrinchador de comandos.
 * Recebe uma linha (ex.: "ls -lha | grep txt") e devolve uma lista de "linhas" de explicação.
 * Funções puras, sem DOM: dá para testar com node.
 */
(function (global) {
  "use strict";

  const COMANDOS = global.COMANDOS || [];
  const OPERADORES = global.OPERADORES || {};

  const DIC = {};
  COMANDOS.forEach(function (c) {
    DIC[c.c] = c;
    (c.alias || []).forEach(function (a) { DIC[a] = c; });
  });

  const REDIRECIONAMENTOS = new Set([">", ">>", "<", "2>", "2>>", "&>", "&>>"]);
  const LISTA_OPS = ["2>&1", "&>>", "&>", "2>>", "2>", ">>", "||", "&&", "|", ">", "<", ";", "&"];
  const tem = function (obj, k) { return !!obj && Object.prototype.hasOwnProperty.call(obj, k); };

  /* ── Tokenização ─────────────────────────────────────────── */
  function tokenizar(linha) {
    const toks = [];
    let atual = "", temPalavra = false, aspa = null, i = 0;
    function fecha() {
      if (temPalavra) { toks.push({ t: "w", v: atual }); atual = ""; temPalavra = false; }
    }
    while (i < linha.length) {
      const c = linha[i];
      if (aspa) { atual += c; if (c === aspa) aspa = null; i++; continue; }
      if (c === '"' || c === "'") { aspa = c; atual += c; temPalavra = true; i++; continue; }
      if (c === "\\" && i + 1 < linha.length) { atual += c + linha[i + 1]; temPalavra = true; i += 2; continue; }
      if (/\s/.test(c)) { fecha(); i++; continue; }
      if (c === "#" && !temPalavra) { toks.push({ t: "c", v: linha.slice(i) }); break; }
      let op = null;
      for (const o of LISTA_OPS) {
        if (linha.startsWith(o, i)) {
          if (o[0] === "2" && temPalavra) continue; // "arquivo2>x": o 2 faz parte da palavra
          op = o; break;
        }
      }
      if (op) { fecha(); toks.push({ t: "op", v: op }); i += op.length; continue; }
      atual += c; temPalavra = true; i++;
    }
    fecha();
    return toks;
  }

  function semAspas(s) {
    if (s.length >= 2 && (s[0] === "'" || s[0] === '"') && s[s.length - 1] === s[0]) return s.slice(1, -1);
    return s;
  }

  /* ── Explicadores de valores ─────────────────────────────── */
  const PERM = { r: "ler", w: "escrever", x: "executar", X: "executar (só pastas ou o que já é executável)", s: "SUID/SGID", t: "sticky bit" };

  function ehModoChmod(a) {
    return /^[0-7]{3,4}$/.test(a) || /^[ugoa]*[-+=][rwxXst]*(,[ugoa]*[-+=][rwxXst]*)*$/.test(a);
  }

  function explicarModo(a) {
    if (/^[0-7]{3,4}$/.test(a)) {
      const ds = a.length === 4 ? a : "0" + a;
      const especial = Number(ds[0]);
      const quem = ["dono (u)", "grupo (g)", "outros (o)"];
      const linhas = [];
      const trios = [];
      for (let i = 0; i < 3; i++) {
        const d = Number(ds[i + 1]);
        const partes = [];
        let s = "";
        [["r", 4], ["w", 2], ["x", 1]].forEach(function (p) {
          if (d & p[1]) { partes.push(p[1] + " (" + p[0] + ")"); s += p[0]; } else s += "-";
        });
        trios.push(s);
        const acoes = s.split("").filter(function (c) { return c !== "-"; }).map(function (c) { return PERM[c]; });
        linhas.push(quem[i] + ": " + d + " = " + (partes.join(" + ") || "0") + " → " + s + " (" + (acoes.length ? acoes.join(", ") : "nenhuma permissão") + ")");
      }
      if (especial) {
        const e = [];
        if (especial & 4) { e.push("4 = SUID: o programa roda com as permissões do dono do arquivo"); trios[0] = trios[0].slice(0, 2) + (trios[0][2] === "x" ? "s" : "S"); }
        if (especial & 2) { e.push("2 = SGID: roda com as permissões do grupo; numa pasta, arquivos novos herdam o grupo dela"); trios[1] = trios[1].slice(0, 2) + (trios[1][2] === "x" ? "s" : "S"); }
        if (especial & 1) { e.push("1 = sticky bit: numa pasta, cada um só apaga o que é seu (como no /tmp)"); trios[2] = trios[2].slice(0, 2) + (trios[2][2] === "x" ? "t" : "T"); }
        linhas.unshift("primeiro dígito " + especial + ": " + e.join("; "));
      }
      linhas.push("como aparece no ls -l: " + trios.join(""));
      return linhas;
    }
    const QUEM = { u: "dono", g: "grupo", o: "outros", a: "todos" };
    const VERBO = { "+": "adiciona", "-": "remove", "=": "define exatamente" };
    const PREP = { "+": "para", "-": "de", "=": "para" };
    return a.split(",").map(function (parte) {
      const m = parte.match(/^([ugoa]*)([-+=])([rwxXst]*)$/);
      if (!m) return parte;
      const quem = m[1] ? m[1].split("").map(function (c) { return QUEM[c]; }).join(", ") : "todos (sem u, g ou o, vale para todos, respeitando o umask)";
      const perms = m[3] ? m[3].split("").map(function (c) { return c + " (" + PERM[c] + ")"; }).join(", ") : "nenhuma permissão";
      return parte + ": " + VERBO[m[2]] + " " + perms + " " + PREP[m[2]] + " " + quem;
    });
  }

  function explicarSed(s) {
    let m = s.match(/^s(.)(.*?)\1(.*?)\1([gipI0-9]*)$/);
    if (m) {
      const r = ["s = substituir (substitute)", "procura: " + (m[2] || "(vazio)"), "troca por: " + (m[3] || "nada (ou seja, apaga o trecho)")];
      m[4].split("").forEach(function (f) {
        if (f === "g") r.push("g = global: troca todas as ocorrências da linha, não só a primeira");
        else if (f === "i" || f === "I") r.push(f + " = ignora maiúsculas e minúsculas");
        else if (f === "p") r.push("p = imprime a linha alterada");
        else if (/\d/.test(f)) r.push(f + " = troca só a " + f + "ª ocorrência da linha");
      });
      if (m[4].indexOf("g") < 0) r.push("sem o g, troca só a primeira ocorrência de cada linha");
      return r;
    }
    m = s.match(/^(\d+|\$)(?:,(\d+|\$))?\s*([pd])$/);
    if (m) {
      const nome = function (x) { return x === "$" ? "a última" : x; };
      const faixa = m[2] ? "linhas " + nome(m[1]) + " até " + nome(m[2]) : "linha " + nome(m[1]);
      return [faixa, m[3] === "p" ? "p = print: imprime essas linhas" : "d = delete: apaga essas linhas"];
    }
    m = s.match(/^\/(.*)\/\s*([pd])$/);
    if (m) {
      return ["/" + m[1] + "/ = linhas que combinam com esse padrão", m[2] === "p" ? "p = print: imprime essas linhas" : "d = delete: apaga essas linhas"];
    }
    return ["script do sed (esse formato eu ainda não destrincho em detalhe)"];
  }

  function explicarAwk(p) {
    const r = [];
    if (/\bBEGIN\b/.test(p)) r.push("BEGIN { } roda uma vez, antes de ler a primeira linha");
    const filtro = p.split("{")[0].replace(/\bBEGIN\b|\bEND\b/g, "").trim();
    if (filtro) r.push(filtro + " é um filtro: a ação só roda nas linhas em que isso for verdade");
    if (p.indexOf("{") < 0) r.push("sem { }, a ação padrão é imprimir a linha inteira");
    if (/\$0/.test(p)) r.push("$0 = a linha inteira");
    const vistos = {};
    (p.match(/\$\d+/g) || []).forEach(function (c) {
      if (c !== "$0" && !vistos[c]) { vistos[c] = 1; r.push(c + " = coluna " + c.slice(1)); }
    });
    if (/\$NF/.test(p)) r.push("$NF = a última coluna");
    else if (/\bNF\b/.test(p)) r.push("NF = quantidade de colunas da linha");
    if (/\bNR\b/.test(p)) r.push("NR = número da linha atual");
    if (/\+=/.test(p)) r.push("+= vai acumulando (somando) o valor");
    if (/\bprintf?\b/.test(p)) r.push("print mostra o resultado");
    if (/\bEND\b/.test(p)) r.push("END { } roda uma vez, depois da última linha");
    return r.length ? r : ["programa awk"];
  }

  function explicarDono(a) {
    const m = a.match(/^([^:.]*)[:.]?(.*)$/);
    const temSep = /[:.]/.test(a);
    if (!temSep) return ["novo dono: " + a + " (o grupo continua o mesmo)"];
    if (!m[1]) return ["só muda o grupo, para " + m[2]];
    if (!m[2]) return ["novo dono: " + m[1], "grupo: o grupo de login de " + m[1]];
    return ["novo dono: " + m[1], "novo grupo: " + m[2]];
  }

  const FN = {
    modo: function (v) { return ehModoChmod(v) ? explicarModo(v) : null; },
    sed: explicarSed,
    size: function (v) {
      const m = v.match(/^([+-]?)(\d+)([cwbkMG]?)$/);
      if (!m) return null;
      const rel = m[1] === "+" ? "maior que" : m[1] === "-" ? "menor que" : "exatamente";
      const un = { c: "bytes", w: "palavras de 2 bytes", b: "blocos de 512 bytes", k: "KiB", M: "MiB", G: "GiB", "": "blocos de 512 bytes" }[m[3]];
      return rel + " " + m[2] + " " + un;
    },
    dias: function (v) {
      const m = v.match(/^([+-]?)(\d+)$/);
      if (!m) return null;
      if (m[1] === "+") return "modificado há mais de " + m[2] + " dia(s)";
      if (m[1] === "-") return "modificado há menos de " + m[2] + " dia(s)" + (m[2] === "1" ? ", ou seja, nas últimas 24 horas" : "");
      return "modificado há exatamente " + m[2] + " dia(s), contados em blocos de 24 horas";
    },
    minutos: function (v) {
      const m = v.match(/^([+-]?)(\d+)$/);
      if (!m) return null;
      if (m[1] === "+") return "modificado há mais de " + m[2] + " minutos";
      if (m[1] === "-") return "modificado há menos de " + m[2] + " minutos";
      return "modificado há exatamente " + m[2] + " minutos";
    },
    perm: function (v) {
      const m = v.match(/^([-/]?)(.*)$/);
      const pre = m[1], modo = m[2];
      const intro = pre === "-" ? "com - na frente: todos esses bits precisam estar ligados (pode ter outros)"
        : pre === "/" ? "com / na frente: basta qualquer um desses bits estar ligado"
        : "sem prefixo: a permissão precisa ser exatamente essa";
      const especiais = {
        "4000": "4000 = SUID: o binário roda como o dono do arquivo. Se o dono é root, roda como root. Alvo clássico de escalada de privilégio",
        "2000": "2000 = SGID: o binário roda com as permissões do grupo do arquivo",
        "6000": "6000 = SUID e SGID",
        "1000": "1000 = sticky bit"
      };
      const chave = /^[0-7]{3,4}$/.test(modo) ? modo.padStart(4, "0") : null;
      if (chave && especiais[chave]) return [intro, especiais[chave]];
      if (ehModoChmod(modo)) return [intro].concat(explicarModo(modo));
      return [intro];
    }
  };

  function explicarValor(o, valor) {
    const u = semAspas(valor);
    if (o.v && tem(o.v, u)) return o.v[u];
    if (o.fn && FN[o.fn]) return FN[o.fn](u);
    return null;
  }

  /* ── Observações genéricas sobre um argumento ─────────────── */
  function observacoes(a) {
    const obs = [];
    const u = semAspas(a);
    if (a === "/dev/null") obs.push("/dev/null é o buraco negro do Linux: o que vai para lá some");
    if (a === "{}") obs.push("{} é o marcador que vira o nome de cada item encontrado");
    if (a[0] === "'") obs.push("aspas simples: o shell não mexe em nada aqui dentro, nem em $variáveis");
    else if (a[0] === '"') obs.push("aspas duplas: vira um item só, mas $variáveis ainda são trocadas pelo valor");
    if (a[0] !== "'") {
      if (/\$\(/.test(a)) obs.push("$( ) roda o comando de dentro e usa a saída dele aqui");
      else if (/\$\{?[A-Za-z_]/.test(a)) obs.push("$ indica variável: o shell troca pelo valor antes de rodar");
    }
    if (a[0] !== "'" && a[0] !== '"') {
      if (/[*?]/.test(a)) obs.push("curinga: o shell expande para todos os nomes que combinam (* = qualquer coisa, ? = um caractere)");
      if (/\{[^}]*(,|\.\.)[^}]*\}/.test(a)) obs.push("chaves: {a,b} vira a e b; {1..5} vira 1 2 3 4 5");
      if (a[0] === "~") obs.push("~ é atalho para a sua pasta home");
    }
    if (/^[\w.-]+@[\w.-]+(:.*)?$/.test(u)) obs.push("formato usuário@servidor" + (u.indexOf(":") > 0 ? ", e depois do : vem o caminho lá dentro" : ""));
    if (/^https?:\/\//.test(u)) obs.push("endereço web (URL)");
    return obs;
  }

  /* ── Montagem das linhas de explicação ─────────────────────── */
  function opcoesDe(fd) { return fd[2] || {}; }

  function flagLinha(nome, fd, valor, colado) {
    const o = opcoesDe(fd);
    const l = { tipo: "flag", texto: nome, letra: nome.length === 2 ? nome[1] : null, palavra: fd[0], desc: fd[1], arg: o.arg || null };
    if (valor !== undefined) {
      l.valor = valor;
      l.colado = !!colado;
      l.valorDesc = explicarValor(o, valor);
    }
    return l;
  }

  function proximoServe(o, prox) {
    if (prox === undefined) return false;
    if (o.opc) return o.opc.test(prox);
    return true;
  }

  function argLinha(def, a, pos) {
    let titulo = "argumento";
    if (def && def.pos && def.pos.length) titulo = def.pos[Math.min(pos, def.pos.length - 1)];
    return { tipo: "arg", texto: a, titulo: titulo, obs: observacoes(a) };
  }

  /* Consome tokens até \; ou + (o -exec do find) e devolve [tokens, terminador, novoIndice] */
  function consumirAte(args, j) {
    const dentro = [];
    let k = j + 1;
    for (; k < args.length; k++) {
      if (args[k] === "\\;" || args[k] === "';'" || args[k] === "+") return [dentro, args[k], k];
      dentro.push(args[k]);
    }
    return [dentro, null, k - 1];
  }

  function analisarArgs(def, args, linhas, profundidade) {
    const F = def.f || {};
    let pos = 0;
    let fimOpcoes = false;
    let bsdUsado = false;
    let scriptVeioPorOpcao = false;

    for (let j = 0; j < args.length; j++) {
      const a = args[j];

      if (fimOpcoes) { linhas.push(argLinha(def, a, pos++)); continue; }

      if (a === "--") {
        fimOpcoes = true;
        linhas.push({ tipo: "op", texto: "--", titulo: "fim das opções", desc: "daqui para frente nada é tratado como opção, mesmo começando com -" });
        continue;
      }

      if (def.esp && tem(def.esp, a)) {
        linhas.push({ tipo: "arg", texto: a, titulo: "valor especial", desc: def.esp[a], obs: [] });
        pos++;
        continue;
      }

      if (def.sub && pos === 0 && tem(def.sub, a)) {
        linhas.push({ tipo: "sub", texto: a, desc: def.sub[a] });
        pos++;
        continue;
      }

      if (def.especial === "chmod" && pos === 0 && !tem(F, a) && ehModoChmod(a)) {
        linhas.push({ tipo: "modo", texto: a, titulo: "permissões", lista: explicarModo(a) });
        pos++;
        continue;
      }

      if (def.kv && /^[a-z]+=/.test(a)) {
        const k = a.slice(0, a.indexOf("="));
        linhas.push({ tipo: "kv", texto: a, chave: k, valor: a.slice(k.length + 1), desc: tem(def.kv, k) ? def.kv[k] : "parâmetro que ainda não está no dicionário" });
        continue;
      }

      // Opção longa: --algo ou --algo=valor
      if (a.length > 2 && a.slice(0, 2) === "--") {
        const eq = a.indexOf("=");
        const nome = eq > 0 ? a.slice(0, eq) : a;
        let valor = eq > 0 ? a.slice(eq + 1) : undefined;
        if (!tem(F, nome)) {
          linhas.push({ tipo: "desconhecido", texto: a, desc: "opção longa que ainda não está no meu dicionário de " + def.c + ". Confira em man " + def.c + "." });
          continue;
        }
        const o = opcoesDe(F[nome]);
        if (o.arg && valor === undefined && !o.colado && proximoServe(o, args[j + 1])) valor = args[++j];
        linhas.push(flagLinha(nome, F[nome], valor, eq > 0));
        continue;
      }

      // Opção curta (ou de traço único com nome inteiro)
      if (a.length > 1 && a[0] === "-") {
        if (tem(F, a)) {
          const o = opcoesDe(F[a]);
          if (o.ate) {
            const r = consumirAte(args, j);
            const l = flagLinha(a, F[a]);
            l.filhos = r[0].length ? explicarComando(r[0], profundidade + 1) : [];
            l.fim = r[1];
            l.desc = F[a][1] + "; {} vira o nome de cada arquivo encontrado e " + (r[1] === "+" ? "o + junta vários arquivos numa execução só" : "o \\; marca o fim do comando");
            linhas.push(l);
            j = r[2];
            continue;
          }
          let valor;
          if (o.arg && !o.colado && proximoServe(o, args[j + 1])) valor = args[++j];
          linhas.push(flagLinha(a, F[a], valor));
          if (a === "-e" && def.especial === "sed") scriptVeioPorOpcao = true;
          continue;
        }
        if (/^-\d+$/.test(a) && def.num) {
          linhas.push({ tipo: "flag", texto: a, palavra: "número", desc: def.num.replace("N", a.slice(1)) });
          continue;
        }
        if (def.unico) {
          linhas.push({ tipo: "desconhecido", texto: a, desc: "opção que ainda não está no meu dicionário de " + def.c + ". Confira em man " + def.c + "." });
          continue;
        }
        const letras = a.slice(1);
        const filhos = [];
        for (let k = 0; k < letras.length; k++) {
          const nomeF = "-" + letras[k];
          if (!tem(F, nomeF)) {
            filhos.push({ tipo: "desconhecido", texto: nomeF, letra: letras[k], desc: "essa letra não está no meu dicionário de " + def.c + ". Confira em man " + def.c + "." });
            continue;
          }
          const o = opcoesDe(F[nomeF]);
          if (o.arg) {
            const resto = letras.slice(k + 1);
            if (resto) { filhos.push(flagLinha(nomeF, F[nomeF], resto, true)); break; }
            if (!o.colado && proximoServe(o, args[j + 1])) filhos.push(flagLinha(nomeF, F[nomeF], args[++j]));
            else filhos.push(flagLinha(nomeF, F[nomeF]));
            if (nomeF === "-e" && def.especial === "sed") scriptVeioPorOpcao = true;
          } else {
            filhos.push(flagLinha(nomeF, F[nomeF]));
          }
        }
        if (letras.length === 1 || (filhos.length === 1 && filhos[0].colado)) linhas.push(filhos[0]);
        else linhas.push({ tipo: "grupo", texto: a, filhos: filhos });
        continue;
      }

      // Letras sem traço no estilo BSD (ps aux, tar xzvf)
      if (def.bsd && !bsdUsado && pos === 0 && /^[a-zA-Z]+$/.test(a)) {
        const mapa = def.bsd === true ? null : def.bsd;
        const conhece = a.split("").every(function (ch) { return mapa ? tem(mapa, ch) : tem(F, "-" + ch); });
        if (conhece) {
          bsdUsado = true;
          const filhos = [];
          for (let k = 0; k < a.length; k++) {
            const ch = a[k];
            if (mapa) { filhos.push({ tipo: "flag", texto: ch, letra: ch, palavra: mapa[ch][0], desc: mapa[ch][1] }); continue; }
            const fd = F["-" + ch];
            const o = opcoesDe(fd);
            const l = flagLinha("-" + ch, fd, o.arg && args[j + 1] !== undefined ? args[++j] : undefined);
            l.texto = ch;
            filhos.push(l);
          }
          linhas.push({ tipo: "grupo", texto: a, filhos: filhos, bsd: true });
          continue;
        }
      }

      // Comandos que rodam outro comando (sudo, xargs, watch, strace)
      if (def.prefixo) {
        linhas.push({ tipo: "nota", desc: "daqui em diante é o comando que o " + def.c + " vai rodar" });
        if (/^(['"]).*\1$/.test(a) && j === args.length - 1) {
          explicar(semAspas(a), profundidade + 1).linhas.forEach(function (l) { linhas.push(l); });
        } else {
          explicarComando(args.slice(j), profundidade + 1).forEach(function (l) { linhas.push(l); });
        }
        return;
      }

      // Argumentos com explicador próprio
      if (pos === 0 && def.especial === "chown") {
        linhas.push({ tipo: "modo", texto: a, titulo: "dono e grupo", lista: explicarDono(semAspas(a)) });
        pos++;
        continue;
      }
      if (pos === 0 && def.especial === "sed" && !scriptVeioPorOpcao) {
        linhas.push({ tipo: "modo", texto: a, titulo: "script do sed", lista: explicarSed(semAspas(a)) });
        pos++;
        continue;
      }
      if (pos === 0 && def.especial === "awk") {
        linhas.push({ tipo: "modo", texto: a, titulo: "programa awk", lista: explicarAwk(semAspas(a)) });
        pos++;
        continue;
      }

      linhas.push(argLinha(def, a, pos++));
    }
  }

  function explicarComando(palavras, profundidade) {
    profundidade = profundidade || 0;
    const linhas = [];
    let i = 0;

    while (i < palavras.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(palavras[i])) {
      linhas.push({ tipo: "arg", texto: palavras[i], titulo: "variável de ambiente", desc: "define essa variável só para este comando", obs: [] });
      i++;
    }
    if (i >= palavras.length) return linhas;

    const bruto = palavras[i];
    const nome = semAspas(bruto);
    const resto = palavras.slice(i + 1);

    if (nome === "!!") {
      linhas.push({ tipo: "cmd", texto: bruto, palavra: "histórico", desc: "repete o último comando que você digitou" });
      resto.forEach(function (a, k) { linhas.push(argLinha(null, a, k)); });
      return linhas;
    }
    if (/^!\d+$/.test(nome)) {
      linhas.push({ tipo: "cmd", texto: bruto, palavra: "histórico", desc: "roda o comando número " + nome.slice(1) + " do history" });
      return linhas;
    }

    const base = nome.replace(/^.*\//, "");
    const def = profundidade > 6 ? null : (tem(DIC, nome) ? DIC[nome] : (tem(DIC, base) ? DIC[base] : null));

    if (!def) {
      const ehCaminho = /^(\.{0,2}\/|~\/)/.test(nome);
      linhas.push({
        tipo: ehCaminho ? "cmd" : "desconhecido",
        texto: bruto,
        palavra: ehCaminho ? "programa ou script" : null,
        desc: ehCaminho
          ? "executa o programa ou script que está nesse caminho" + (nome.slice(0, 2) === "./" ? " (./ = na pasta atual)" : "")
          : "esse comando ainda não está no meu dicionário. Tente man " + nome + " ou " + nome + " --help."
      });
      resto.forEach(function (a, k) {
        if (a.length > 1 && a[0] === "-") linhas.push({ tipo: "desconhecido", texto: a, desc: "opção do " + nome });
        else linhas.push(argLinha(null, a, k));
      });
      return linhas;
    }

    linhas.push({ tipo: "cmd", texto: bruto, palavra: def.nome, desc: def.r, ref: def.c, nivel: def.n, perigo: def.perigo || null });
    analisarArgs(def, resto, linhas, profundidade);
    return linhas;
  }

  /* ── Linha completa: separa em comandos, pipes e redirecionamentos ── */
  function explicar(linha, profundidade) {
    profundidade = profundidade || 0;
    const toks = tokenizar(String(linha || "").trim());
    const linhas = [];
    let palavras = [];
    let redirs = [];

    function fechaComando() {
      if (palavras.length) explicarComando(palavras, profundidade).forEach(function (l) { linhas.push(l); });
      redirs.forEach(function (r) { linhas.push(r); });
      palavras = [];
      redirs = [];
    }

    for (let i = 0; i < toks.length; i++) {
      const tk = toks[i];
      if (tk.t === "w") { palavras.push(tk.v); continue; }
      if (tk.t === "c") { fechaComando(); linhas.push({ tipo: "comentario", texto: tk.v, desc: "comentário: o shell ignora tudo depois do #" }); continue; }
      const info = OPERADORES[tk.v] || [tk.v, ""];
      if (tk.v === "2>&1") { redirs.push({ tipo: "op", texto: tk.v, titulo: info[0], desc: info[1] }); continue; }
      if (REDIRECIONAMENTOS.has(tk.v)) {
        const alvo = toks[i + 1] && toks[i + 1].t === "w" ? toks[++i].v : null;
        const r = { tipo: "op", texto: tk.v, titulo: info[0], desc: info[1], alvo: alvo };
        if (alvo === "/dev/null") r.alvoDesc = "/dev/null é o buraco negro do Linux: o que vai para lá some";
        redirs.push(r);
        continue;
      }
      fechaComando();
      linhas.push({ tipo: "op", texto: tk.v, titulo: info[0], desc: info[1], separador: true });
    }
    fechaComando();
    return { linhas: linhas };
  }

  /* Destaca a letra da opção dentro da palavra de origem.
     Devolve [antes, letra, depois] ou null. Ordem: [x] explícito, início de palavra
     com a mesma caixa, início de palavra ignorando caixa, maiúscula ou dígito em qualquer lugar. */
  function marcarLetra(palavra, letra) {
    if (!palavra || !letra) return null;
    const exp = palavra.match(/^(.*?)\[(.)\](.*)$/);
    if (exp) return [exp[1], exp[2], exp[3]];
    const inicios = [];
    const re = /(^|[\s\-(+/])([^\s\-(+/])/g;
    let m;
    while ((m = re.exec(palavra))) inicios.push(m.index + m[1].length);
    for (const i of inicios) if (palavra[i] === letra) return [palavra.slice(0, i), palavra[i], palavra.slice(i + 1)];
    for (const i of inicios) if (palavra[i].toLowerCase() === letra.toLowerCase()) return [palavra.slice(0, i), palavra[i], palavra.slice(i + 1)];
    if (/[A-Z0-9]/.test(letra)) {
      const i = palavra.indexOf(letra);
      if (i >= 0) return [palavra.slice(0, i), letra, palavra.slice(i + 1)];
    }
    return null;
  }

  function limparMarcador(palavra) {
    return palavra ? palavra.replace(/\[(.)\]/, "$1") : palavra;
  }

  global.Explicador = {
    explicar: explicar,
    tokenizar: tokenizar,
    marcarLetra: marcarLetra,
    limparMarcador: limparMarcador,
    dicionario: DIC
  };
})(typeof window !== "undefined" ? window : globalThis);
