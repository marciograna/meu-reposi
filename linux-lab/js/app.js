/* Linux Lab: interface (destrinchador, fichas, progresso e tema). */
(function () {
  "use strict";

  const COMANDOS = window.COMANDOS || [];
  const E = window.Explicador;
  const NIVEIS = { basico: "Básico", intermediario: "Intermediário", avancado: "Avançado" };
  const SUGESTOES = [
    "ls -lha",
    "tar -xzvf backup.tar.gz",
    "sudo ss -tulnp",
    "ps aux | grep nginx",
    "find / -perm -4000 -type f 2>/dev/null",
    "chmod 755 script.sh",
    "cut -d: -f1 /etc/passwd",
    "awk -F: '{print $1}' /etc/passwd"
  ];
  const reduzMovimento = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const $ = function (sel, el) { return (el || document).querySelector(sel); };
  const $$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };
  const esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  const normalizar = function (s) {
    return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  };

  /* ── Armazenamento local (pode falhar em aba anônima) ── */
  const store = {
    ler: function (k, padrao) {
      try { const v = localStorage.getItem(k); return v === null ? padrao : JSON.parse(v); } catch (e) { return padrao; }
    },
    gravar: function (k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento: segue sem salvar */ }
    }
  };

  let progresso = store.ler("linuxlab:progresso", {});
  if (!progresso || typeof progresso !== "object") progresso = {};
  const filtro = { nivel: store.ler("linuxlab:nivel", "todos"), busca: "", status: "todos" };
  if (filtro.nivel !== "todos" && !NIVEIS[filtro.nivel]) filtro.nivel = "todos";

  /* ── Mnemônico: "l de long" com a letra destacada ── */
  function mnemoHTML(palavra, letra, curto) {
    if (!palavra) return "";
    const m = E.marcarLetra(palavra, letra);
    if (!m) return '<span class="mnemo"><em>' + esc(E.limparMarcador(palavra)) + "</em></span>";
    const destacada = "<em>" + esc(m[0]) + "<b>" + esc(m[1]) + "</b>" + esc(m[2]) + "</em>";
    return '<span class="mnemo">' + (curto ? destacada : "<b>" + esc(m[1]) + "</b> de " + destacada) + "</span>";
  }

  /* ── Destrinchador ─────────────────────────────────── */
  function coletarChips(linhas, chips) {
    linhas.forEach(function (l) {
      switch (l.tipo) {
        case "cmd": case "sub": chips.push([l.texto, "cmd"]); break;
        case "flag":
          if (l.colado) chips.push([l.texto + (l.texto.slice(0, 2) === "--" ? "=" : "") + l.valor, "flag"]);
          else {
            chips.push([l.texto, "flag"]);
            if (l.valor !== undefined) chips.push([l.valor, "val"]);
          }
          if (l.filhos) { coletarChips(l.filhos, chips); if (l.fim) chips.push([l.fim, "op"]); }
          break;
        case "grupo":
          chips.push([l.texto, "flag"]);
          l.filhos.forEach(function (f) { if (f.valor !== undefined && !f.colado) chips.push([f.valor, "val"]); });
          break;
        case "kv": chips.push([l.texto, "flag"]); break;
        case "arg": case "modo": chips.push([l.texto, "arg"]); break;
        case "op": chips.push([l.texto, "op"]); if (l.alvo) chips.push([l.alvo, "arg"]); break;
        case "desconhecido": case "comentario": chips.push([l.texto, "unk"]); break;
        default: break;
      }
    });
  }

  function listaHTML(itens) {
    if (!itens) return "";
    if (!Array.isArray(itens)) itens = [itens];
    if (itens.length === 1) return '<p class="obs">' + esc(itens[0]) + "</p>";
    return '<ul class="lista-valor">' + itens.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul>";
  }

  function valorHTML(l) {
    if (l.valor === undefined) {
      return l.arg ? '<p class="obs">espera um valor logo depois: <em>' + esc(l.arg) + "</em></p>" : "";
    }
    let h = '<p class="valor"><span class="rotulo-valor">valor</span><span class="chip c-val">' + esc(l.valor) + "</span>";
    if (l.valorDesc && !Array.isArray(l.valorDesc)) h += "<span>" + esc(l.valorDesc) + "</span>";
    h += "</p>";
    if (Array.isArray(l.valorDesc)) h += listaHTML(l.valorDesc);
    return h;
  }

  function item(classe, token, titulo, desc, extra) {
    return '<li class="ex t-' + classe + '"><code class="ex-tok">' + esc(token) + '</code><div class="ex-txt"><p class="ex-tit">' +
      titulo + "</p>" + (desc ? '<p class="ex-desc">' + desc + "</p>" : "") + (extra || "") + "</div></li>";
  }

  function tipo(t) { return '<span class="tipo">' + esc(t) + "</span>"; }

  function grupoHTML(l) {
    const n = l.filhos.length;
    let desc;
    if (l.bsd) desc = "Estilo antigo (BSD), sem traço: cada letra é uma opção.";
    else desc = "É o mesmo que " + l.filhos.map(function (f) { return f.texto; }).join(" ") + ".";
    const comValor = l.filhos.filter(function (f) { return f.valor !== undefined && !f.colado; })[0];
    const colado = l.filhos.filter(function (f) { return f.colado; })[0];
    if (comValor) desc += " A ordem das letras não importa, menos a do " + comValor.texto + ": ele recebe um valor (" + comValor.valor + "), então fica por último.";
    else if (colado) desc += " O que vem colado depois do " + colado.texto + " é o valor dele.";
    else desc += " A ordem das letras não importa.";

    const letras = l.filhos.map(function (f) {
      const desconhecida = f.tipo === "desconhecido";
      const letra = f.letra || f.texto.slice(-1);
      return '<li class="letra-item' + (desconhecida ? " is-unk" : "") + '"><span class="letra" aria-hidden="true">' + esc(letra) +
        '</span><div class="ex-txt"><p class="ex-tit"><code>' + esc(f.texto) + "</code>" +
        (desconhecida ? tipo("não reconhecida") : mnemoHTML(f.palavra, f.letra, true)) + '</p><p class="ex-desc">' + esc(f.desc) + "</p>" +
        valorHTML(f) + "</div></li>";
    }).join("");
    return item("flag", l.texto, tipo(n + " opções juntas"), esc(desc), '<ol class="letras">' + letras + "</ol>");
  }

  function linhaHTML(l) {
    switch (l.tipo) {
      case "cmd": {
        let desc = esc(l.desc);
        if (l.ref) desc += ' <a class="ver-ficha" href="#cmd-' + esc(l.ref) + '" data-ref="' + esc(l.ref) + '">ver ficha</a>';
        const titulo = tipo(l.nivel ? "comando · " + NIVEIS[l.nivel] : "comando") + (l.palavra ? '<span class="origem-nome">' + esc(l.palavra) + "</span>" : "");
        return item("cmd", l.texto, titulo, desc, l.perigo ? '<p class="aviso"><strong>Cuidado:</strong> ' + esc(l.perigo) + "</p>" : "");
      }
      case "flag": {
        let extra = valorHTML(l);
        if (l.filhos) {
          extra += '<ol class="explicacao aninhada">' + l.filhos.map(linhaHTML).join("") + "</ol>";
          if (!l.fim) extra += '<p class="obs">Faltou fechar o comando com <code>\\;</code> ou <code>+</code>.</p>';
        }
        const tok = l.colado ? l.texto + (l.texto.slice(0, 2) === "--" ? "=" : "") + l.valor : l.texto;
        return item("flag", tok, tipo("opção") + mnemoHTML(l.palavra, l.letra), esc(l.desc), extra);
      }
      case "grupo": return grupoHTML(l);
      case "sub": return item("cmd", l.texto, tipo("subcomando"), esc(l.desc));
      case "arg": return item("arg", l.texto, tipo(l.titulo), l.desc ? esc(l.desc) : "", listaHTML(l.obs && l.obs.length ? l.obs : null));
      case "modo": return item("arg", l.texto, tipo(l.titulo), "", listaHTML(l.lista));
      case "kv": return item("flag", l.texto, tipo("parâmetro") + "<em>" + esc(l.chave) + "</em>", esc(l.desc));
      case "op": {
        const desc = esc(l.desc) + (l.alvo ? " → <code>" + esc(l.alvo) + "</code>" : "");
        return item("op", l.alvo ? l.texto + " " + l.alvo : l.texto, tipo(l.titulo), desc, l.alvoDesc ? '<p class="obs">' + esc(l.alvoDesc) + "</p>" : "");
      }
      case "nota": return '<li class="ex-nota">' + esc(l.desc) + ":</li>";
      case "comentario": return item("unk", "#", tipo("comentário"), esc(l.desc));
      case "desconhecido": return item("unk", l.texto, tipo("não reconhecido"), esc(l.desc));
      default: return "";
    }
  }

  function explicar(linha) {
    const saida = $("#resultado");
    const texto = String(linha || "").trim();
    if (!texto) {
      saida.innerHTML = '<p class="resultado-vazio">Digite um comando acima, por exemplo <code>ls -lha</code>.</p>';
      return;
    }
    let r;
    try { r = E.explicar(texto); } catch (e) {
      saida.innerHTML = '<p class="resultado-vazio">Não consegui ler esse comando. Confira se as aspas estão fechadas.</p>';
      return;
    }
    const chips = [];
    coletarChips(r.linhas, chips);
    saida.innerHTML =
      '<p class="linha-colorida">' + chips.map(function (c) { return '<span class="chip c-' + c[1] + '">' + esc(c[0]) + "</span>"; }).join(" ") + "</p>" +
      '<ol class="explicacao">' + r.linhas.map(linhaHTML).join("") + "</ol>";
  }

  function explicarEMostrar(linha) {
    const entrada = $("#entrada");
    entrada.value = linha;
    explicar(linha);
    $(".destrinchador").scrollIntoView({ behavior: reduzMovimento ? "auto" : "smooth", block: "start" });
  }

  /* ── Fichas dos comandos ───────────────────────────── */
  function paresHTML(titulo, obj, classeChave) {
    const chaves = Object.keys(obj || {});
    if (!chaves.length) return "";
    return "<div><h3>" + esc(titulo) + '</h3><dl class="pares">' + chaves.map(function (k) {
      return "<div><dt><code" + (classeChave ? ' class="' + classeChave + '"' : "") + ">" + esc(k) + "</code></dt><dd>" + esc(obj[k]) + "</dd></div>";
    }).join("") + "</dl></div>";
  }

  function fichaHTML(c) {
    const partes = [];
    partes.push('<p class="origem">O nome vem de <em>' + esc(c.nome) + "</em>.</p>");
    partes.push("<div><h3>Sintaxe</h3><pre class=\"sintaxe\"><code>" + esc(c.s) + "</code></pre></div>");

    const flags = Object.keys(c.f || {});
    if (flags.length) {
      partes.push('<div><h3>Opções</h3><div class="opcoes">' + flags.map(function (k) {
        const fd = c.f[k];
        const o = fd[2] || {};
        const letra = k.length === 2 ? k[1] : null;
        return '<div class="opcao"><code class="opcao-nome">' + esc(k) + (o.arg ? ' <span class="opcao-arg">' + esc(o.arg) + "</span>" : "") +
          '</code><div class="opcao-txt"><p class="opcao-mnemo">' + mnemoHTML(fd[0], letra) + "</p><p>" + esc(fd[1]) + "</p></div></div>";
      }).join("") + "</div></div>");
    }
    if (c.bsd && c.bsd !== true) {
      partes.push('<div><h3>Letras sem traço (estilo BSD)</h3><div class="opcoes">' + Object.keys(c.bsd).map(function (k) {
        return '<div class="opcao"><code class="opcao-nome">' + esc(k) + '</code><div class="opcao-txt"><p class="opcao-mnemo">' +
          mnemoHTML(c.bsd[k][0], k) + "</p><p>" + esc(c.bsd[k][1]) + "</p></div></div>";
      }).join("") + "</div></div>");
    }
    partes.push(paresHTML("Subcomandos", c.sub));
    partes.push(paresHTML("Parâmetros", c.kv));
    partes.push(paresHTML("Valores especiais", c.esp));

    partes.push('<div><h3>Exemplos</h3><ul class="exemplos">' + c.ex.map(function (e) {
      return '<li class="exemplo"><div class="exemplo-linha"><code>' + esc(e[0]) + '</code><span class="exemplo-acoes">' +
        '<button type="button" class="botao-mini" data-acao="explicar" data-cmd="' + esc(e[0]) + '">Explicar</button>' +
        '<button type="button" class="botao-mini" data-acao="copiar" data-cmd="' + esc(e[0]) + '">Copiar</button></span></div>' +
        "<p>" + esc(e[1]) + "</p></li>";
    }).join("") + "</ul></div>");

    if (c.dica) partes.push('<p class="nota-caixa dica"><strong>Dica</strong>' + esc(c.dica) + "</p>");
    if (c.perigo) partes.push('<p class="nota-caixa perigo"><strong>Cuidado</strong>' + esc(c.perigo) + "</p>");

    partes.push('<div class="progresso-botoes" role="group" aria-label="Progresso em ' + esc(c.c) + '">' +
      '<button type="button" class="marcar" data-estado="aprendi" data-ref="' + esc(c.c) + '" aria-pressed="false">Aprendi</button>' +
      '<button type="button" class="marcar" data-estado="revisar" data-ref="' + esc(c.c) + '" aria-pressed="false">Revisar depois</button></div>');

    return '<details class="ficha" id="cmd-' + esc(c.c) + '" data-ref="' + esc(c.c) + '">' +
      '<summary><code class="ficha-cmd">' + esc(c.c) + '</code><span class="ficha-resumo">' + esc(c.r) + "</span>" +
      '<span class="ficha-meta"><span class="selo">' + NIVEIS[c.n] + '</span><span class="estado" hidden></span></span></summary>' +
      '<div class="ficha-corpo">' + partes.join("") + "</div></details>";
  }

  const indice = COMANDOS.map(function (c) {
    const textos = [c.c, c.r, c.nome, c.cat, NIVEIS[c.n], c.dica || "", c.perigo || ""];
    Object.keys(c.f || {}).forEach(function (k) { textos.push(k, E.limparMarcador(c.f[k][0]), c.f[k][1]); });
    Object.keys(c.sub || {}).forEach(function (k) { textos.push(k, c.sub[k]); });
    c.ex.forEach(function (e) { textos.push(e[0], e[1]); });
    return { c: c, texto: normalizar(textos.join(" ")) };
  });

  function atualizarFicha(ref) {
    const el = document.getElementById("cmd-" + ref);
    if (!el) return;
    const st = progresso[ref] || null;
    const selo = $(".estado", el);
    selo.hidden = !st;
    if (st) { selo.dataset.estado = st; selo.textContent = st === "aprendi" ? "aprendi" : "revisar"; }
    $$(".marcar", el).forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.estado === st)); });
  }

  function renderNiveis() {
    const grupos = [["todos", "Todos"]].concat(Object.keys(NIVEIS).map(function (k) { return [k, NIVEIS[k]]; }));
    $("#niveis").innerHTML = grupos.map(function (g) {
      return '<button type="button" class="nivel" data-nivel="' + g[0] + '" aria-pressed="false"><span class="nivel-nome">' + g[1] +
        '</span><span class="barra"><i></i></span><span class="nivel-prog"></span></button>';
    }).join("");
    atualizarNiveis();
  }

  function atualizarNiveis() {
    $$(".nivel").forEach(function (b) {
      const n = b.dataset.nivel;
      const doNivel = COMANDOS.filter(function (c) { return n === "todos" || c.n === n; });
      const feitos = doNivel.filter(function (c) { return progresso[c.c] === "aprendi"; }).length;
      $(".nivel-prog", b).textContent = feitos + "/" + doNivel.length + " aprendidos";
      $(".barra i", b).style.width = (doNivel.length ? (feitos / doNivel.length) * 100 : 0) + "%";
      b.setAttribute("aria-pressed", String(filtro.nivel === n));
    });
  }

  function aplicarFiltros() {
    const termos = normalizar(filtro.busca).split(/\s+/).filter(Boolean);
    const exato = termos.length === 1 ? termos[0] : null;
    let visiveis = 0;
    indice.forEach(function (it) {
      const c = it.c;
      const el = document.getElementById("cmd-" + c.c);
      const st = progresso[c.c] || "novo";
      const ok = (filtro.nivel === "todos" || c.n === filtro.nivel) &&
        (filtro.status === "todos" || filtro.status === st) &&
        termos.every(function (t) { return it.texto.indexOf(t) >= 0; });
      el.hidden = !ok;
      el.style.order = exato && c.c === exato ? "-1" : "";
      if (ok) visiveis++;
    });
    $("#vazio").hidden = visiveis > 0;
    $("#contagem").textContent = "Mostrando " + visiveis + " de " + COMANDOS.length + " comandos";
  }

  function marcar(ref, estado) {
    if (progresso[ref] === estado) delete progresso[ref];
    else progresso[ref] = estado;
    store.gravar("linuxlab:progresso", progresso);
    atualizarFicha(ref);
    atualizarNiveis();
    if (filtro.status !== "todos") aplicarFiltros();
  }

  function abrirFicha(ref) {
    const el = document.getElementById("cmd-" + ref);
    if (!el) return;
    if (el.hidden) {
      filtro.nivel = "todos"; filtro.busca = ""; filtro.status = "todos";
      $("#busca").value = ""; $("#filtro-status").value = "todos";
      atualizarNiveis();
      aplicarFiltros();
    }
    el.open = true;
    el.scrollIntoView({ behavior: reduzMovimento ? "auto" : "smooth", block: "start" });
  }

  function copiar(texto, botao) {
    const rotulo = botao.textContent;
    const avisa = function (msg) {
      botao.textContent = msg;
      setTimeout(function () { botao.textContent = rotulo; }, 1600);
    };
    const selecionar = function () {
      const code = botao.closest(".exemplo").querySelector("code");
      const sel = window.getSelection();
      const r = document.createRange();
      r.selectNodeContents(code);
      sel.removeAllRanges();
      sel.addRange(r);
      avisa("Selecionado");
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(function () { avisa("Copiado"); }, selecionar);
      } else selecionar();
    } catch (e) { selecionar(); }
  }

  /* ── Tema ──────────────────────────────────────────── */
  function temaAtual() {
    const t = document.documentElement.getAttribute("data-theme");
    if (t === "dark" || t === "light") return t;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  /* ── Montagem ──────────────────────────────────────── */
  function iniciar() {
    $("#sugestoes").innerHTML = SUGESTOES.map(function (s) {
      return '<button type="button" class="sugestao" data-cmd="' + esc(s) + '">' + esc(s) + "</button>";
    }).join("");

    $("#lista").innerHTML = COMANDOS.map(fichaHTML).join("");
    COMANDOS.forEach(function (c) { atualizarFicha(c.c); });
    renderNiveis();
    aplicarFiltros();

    const ops = window.OPERADORES || {};
    const cola = Object.keys(ops).map(function (k) { return [k, ops[k][0] + ": " + ops[k][1]]; }).concat(window.ATALHOS || []);
    $("#cola").innerHTML = cola.map(function (p) { return "<div><dt>" + esc(p[0]) + "</dt><dd>" + esc(p[1]) + "</dd></div>"; }).join("");

    const entrada = $("#entrada");
    explicar(entrada.value);

    let espera = null;
    entrada.addEventListener("input", function () {
      clearTimeout(espera);
      espera = setTimeout(function () { explicar(entrada.value); }, 120);
    });
    $("#form-explicar").addEventListener("submit", function (ev) {
      ev.preventDefault();
      explicar(entrada.value);
    });
    $("#sugestoes").addEventListener("click", function (ev) {
      const b = ev.target.closest(".sugestao");
      if (b) { entrada.value = b.dataset.cmd; explicar(b.dataset.cmd); }
    });
    $("#sortear").addEventListener("click", function () {
      const todos = [];
      COMANDOS.forEach(function (c) { c.ex.forEach(function (e) { todos.push(e[0]); }); });
      let escolhido = entrada.value;
      while (todos.length > 1 && escolhido === entrada.value) escolhido = todos[Math.floor(Math.random() * todos.length)];
      entrada.value = escolhido;
      explicar(escolhido);
    });
    $("#resultado").addEventListener("click", function (ev) {
      const a = ev.target.closest(".ver-ficha");
      if (a) abrirFicha(a.dataset.ref);
    });

    $("#niveis").addEventListener("click", function (ev) {
      const b = ev.target.closest(".nivel");
      if (!b) return;
      filtro.nivel = b.dataset.nivel;
      store.gravar("linuxlab:nivel", filtro.nivel);
      atualizarNiveis();
      aplicarFiltros();
    });
    $("#busca").addEventListener("input", function (ev) { filtro.busca = ev.target.value; aplicarFiltros(); });
    $("#filtro-status").addEventListener("change", function (ev) { filtro.status = ev.target.value; aplicarFiltros(); });

    $("#lista").addEventListener("click", function (ev) {
      const b = ev.target.closest("button");
      if (!b) return;
      if (b.dataset.acao === "explicar") explicarEMostrar(b.dataset.cmd);
      else if (b.dataset.acao === "copiar") copiar(b.dataset.cmd, b);
      else if (b.classList.contains("marcar")) marcar(b.dataset.ref, b.dataset.estado);
    });

    $("#tema").addEventListener("click", function () {
      const novo = temaAtual() === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", novo);
      try { localStorage.setItem("linuxlab:tema", novo); } catch (e) { /* segue sem salvar */ }
    });

    const abrirPeloHash = function () {
      const h = decodeURIComponent(location.hash || "");
      if (h.indexOf("#cmd-") === 0) abrirFicha(h.slice(5));
    };
    window.addEventListener("hashchange", abrirPeloHash);
    abrirPeloHash();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
