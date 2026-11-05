// Testes do destrinchador. Rode com: node linux-lab/testes/explicador.test.js
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ctx = {};
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ["comandos.js", "explicador.js"]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js", f), "utf8"), ctx, { filename: f });
}
const { COMANDOS, Explicador: E } = ctx;

// Objetos criados dentro do vm têm outro protótipo; JSON deixa tudo comparável.
const puro = (x) => JSON.parse(JSON.stringify(x));

function achatar(linhas) {
  return linhas.flatMap((l) => [l, ...achatar(l.filhos || [])]);
}

test("todo exemplo do dicionário é reconhecido por inteiro", () => {
  for (const c of COMANDOS) {
    for (const [ex] of c.ex) {
      const desconhecidos = achatar(E.explicar(ex).linhas).filter((l) => l.tipo === "desconhecido");
      assert.equal(desconhecidos.length, 0, `${ex} → ${desconhecidos.map((d) => d.texto).join(", ")}`);
    }
  }
});

test("nomes de comando não se repetem", () => {
  const nomes = COMANDOS.map((c) => c.c);
  assert.equal(new Set(nomes).size, nomes.length);
});

test("ls -lha vira três opções, cada uma com sua palavra", () => {
  const [cmd, grupo] = E.explicar("ls -lha").linhas;
  assert.equal(cmd.texto, "ls");
  assert.equal(grupo.tipo, "grupo");
  assert.deepEqual(puro(grupo.filhos.map((f) => [f.texto, f.palavra])), [["-l", "long"], ["-h", "human-readable"], ["-a", "all"]]);
});

test("tar -xzvf pega o nome do arquivo como valor do -f", () => {
  const grupo = E.explicar("tar -xzvf backup.tar.gz").linhas[1];
  const f = grupo.filhos.find((x) => x.texto === "-f");
  assert.equal(f.valor, "backup.tar.gz");
});

test("ps aux usa as letras do estilo BSD", () => {
  const grupo = E.explicar("ps aux").linhas[1];
  assert.equal(grupo.bsd, true);
  assert.deepEqual(puro(grupo.filhos.map((f) => f.letra)), ["a", "u", "x"]);
});

test("valor colado: cut -d: e sed -i.bak", () => {
  const cut = E.explicar("cut -d: -f1 x").linhas;
  assert.equal(cut[1].valor, ":");
  assert.equal(cut[2].valor, "1");
  const sed = E.explicar("sed -i.bak 's/a/b/g' f").linhas;
  assert.equal(sed[1].valor, ".bak");
  assert.equal(sed[2].tipo, "modo");
});

test("chmod 755 e chmod 4755 são explicados dígito por dígito", () => {
  const modo = E.explicar("chmod 755 x").linhas[1];
  assert.ok(modo.lista.some((l) => l.includes("rwxr-xr-x")));
  const suid = E.explicar("chmod 4755 x").linhas[1];
  assert.ok(suid.lista[0].includes("SUID"));
  assert.ok(suid.lista.some((l) => l.includes("rwsr-xr-x")));
});

test("pipes, redirecionamentos e /dev/null", () => {
  const linhas = E.explicar("find / -perm -4000 2>/dev/null | wc -l").linhas;
  const redir = linhas.find((l) => l.texto === "2>");
  assert.equal(redir.alvo, "/dev/null");
  assert.ok(linhas.some((l) => l.tipo === "op" && l.texto === "|"));
  assert.equal(linhas.at(-2).texto, "wc");
});

test("sudo e watch explicam o comando que vão rodar", () => {
  const sudo = E.explicar("sudo apt install htop").linhas;
  assert.ok(sudo.some((l) => l.tipo === "sub" && l.texto === "install"));
  const watch = E.explicar("watch -d 'ss -tn'").linhas;
  assert.ok(watch.some((l) => l.tipo === "cmd" && l.texto === "ss"));
});

test("find -exec explica o comando interno até o \\;", () => {
  const exec = E.explicar(String.raw`find . -name "*.tmp" -exec rm {} \;`).linhas.find((l) => l.texto === "-exec");
  assert.equal(exec.fim, "\\;");
  assert.equal(exec.filhos[0].texto, "rm");
});

test("letra destacada na palavra de origem", () => {
  assert.deepEqual(puro(E.marcarLetra("long", "l")), ["", "l", "ong"]);
  assert.deepEqual(puro(E.marcarLetra("LINE-NUMBERS", "N")), ["LINE-", "N", "UMBERS"]);
  assert.deepEqual(puro(E.marcarLetra("g[z]ip", "z")), ["g", "z", "ip"]);
  assert.equal(E.marcarLetra("insecure", "k"), null);
});
