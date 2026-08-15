const API = "https://script.google.com/macros/s/AKfycbwgV_M7WiFOZ_a_h6_mnFBpaxYygh0XiTY2LFuu2Gs3B9C6-YRQSczIMCsYiWoHrIhSnw/exec";

let produtos = [];
let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
let trocoSelecionado = null;

// 🚀 CARREGAR PRODUTOS
async function carregar(){
  try{
    const res = await fetch(API);
    produtos = await res.json();

    document.getElementById("status").innerText = "🟢 Online";

    render(produtos);
    atualizarCarrinho();

  }catch(e){
    document.getElementById("status").innerText = "🔴 Erro";
  }
}

// 🛡️ ESCAPAR HTML (evita XSS vindo dos dados da planilha)
function escapeHtml(str){
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 🎨 RENDER PRODUTOS
function render(lista){

  let container = document.getElementById("produtos");
  if(!container) return;

  container.innerHTML = "";

  lista.forEach(p=>{

    let item = carrinho.find(i=>i.codigo === p.codigo);
    let qtd = item ? item.qtd : 0;

    let botao = qtd > 0
      ? `<div class="fab-stepper">
           <button onclick="menos('${p.codigo}')">−</button>
           <span>${qtd}</span>
           <button onclick="add('${p.codigo}')">+</button>
         </div>`
      : `<button class="fab-add" onclick="add('${p.codigo}')">+</button>`;

    container.innerHTML += `
      <div class="card">
        <div class="card-media">
          <img src="${escapeHtml(p.imagem || 'https://via.placeholder.com/150')}">
          ${botao}
        </div>

        <div class="card-info">
          <b>${escapeHtml(p.nome)}</b>
          <span class="preco">R$ ${Number(p.preco).toFixed(2)}</span>
        </div>
      </div>
    `;
  });
}

// ➕ ADICIONAR
function add(codigo){

  let produto = produtos.find(p=>String(p.codigo) === String(codigo));
  if(!produto) return;

  let item = carrinho.find(p=>String(p.codigo) === String(codigo));

  if(item){
    item.qtd++;
  }else{
    carrinho.push({
      codigo: produto.codigo,
      nome: produto.nome,
      preco: Number(produto.preco),
      qtd: 1
    });
  }

  salvar();
}

// ➖ REMOVER
function menos(codigo){

  let item = carrinho.find(p=>String(p.codigo) === String(codigo));
  if(!item) return;

  item.qtd--;

  if(item.qtd <= 0){
    carrinho = carrinho.filter(p=>String(p.codigo) !== String(codigo));
  }

  salvar();
}

// 💾 SALVAR
function salvar(){
  localStorage.setItem("carrinho", JSON.stringify(carrinho));
  atualizarCarrinho();
}

// 🔄 ATUALIZAR CARRINHO
function atualizarCarrinho(){

  let total = 0;
  let qtd = 0;

  carrinho.forEach(p=>{
    total += p.preco * p.qtd;
    qtd += p.qtd;
  });

  document.getElementById("qtdTop").innerText = `(${qtd})`;
  document.getElementById("totalTop").innerText = `R$ ${total.toFixed(2)}`;

  document.getElementById("qtd").innerText = `(${qtd})`;
  document.getElementById("total").innerText = `Total: R$ ${total.toFixed(2)}`;

  renderizarCarrinho();
  render(produtos);
}

// 🛒 RENDER CARRINHO
function renderizarCarrinho(){

  let container = document.getElementById("itens");
  if(!container) return;

  container.innerHTML = "";

  carrinho.forEach(p=>{
    container.innerHTML += `
      <div class="item">
        ${escapeHtml(p.nome)} x${p.qtd}
      </div>
    `;
  });
}

// 🛒 ABRIR / FECHAR
function toggleCarrinho(){
  document.getElementById("carrinho").classList.toggle("aberto");
}

// 🎯 ENTREGA / RETIRADA
function toggleTipo(){

  let tipo = document.getElementById("tipo")?.value || "";

  document.getElementById("boxEndereco").style.display =
    tipo === "Entrega" ? "block" : "none";

  document.getElementById("boxPagamento").style.display =
    tipo === "Entrega" ? "block" : "none";
}

// 💰 PAGAMENTO
function togglePagamento(){

  let pagamento = document.getElementById("pagamento")?.value || "";
  let box = document.getElementById("boxTroco");

  if(!box) return;

  if(pagamento === "Dinheiro"){
    box.style.display = "block";
  }else{
    box.style.display = "none";
    trocoSelecionado = null;
    document.getElementById("trocoInput").value = "";
  }
}

// 🎯 SELECIONAR TROCO
function selecionarTroco(valor){

  trocoSelecionado = valor;

  document.querySelectorAll(".troco-opcoes button")
    .forEach(btn => btn.classList.remove("ativo"));

  event.target.classList.add("ativo");

  document.getElementById("trocoInput").value = "";
}

// ✍️ TROCO DIGITADO MANUALMENTE (cancela a seleção dos botões)
document.getElementById("trocoInput").addEventListener("input", () => {
  trocoSelecionado = null;

  document.querySelectorAll(".troco-opcoes button")
    .forEach(btn => btn.classList.remove("ativo"));
});

// 📲 FINALIZAR PEDIDO — PREMIUM
function finalizar(){

  if(carrinho.length === 0){
    alert("Carrinho vazio");
    return;
  }

  let nome = document.getElementById("nome")?.value || "";
  let telefone = document.getElementById("telefone")?.value || "";
  let tipo = document.getElementById("tipo")?.value || "";
  let endereco = document.getElementById("endereco")?.value || "";
  let pagamento = document.getElementById("pagamento")?.value || "";

  let trocoInput = document.getElementById("trocoInput")?.value || "";
  let troco = trocoSelecionado !== null ? trocoSelecionado : trocoInput;

  if(!nome || !telefone || !tipo){
    alert("Preencha os dados");
    return;
  }

  if(tipo === "Entrega" && (!endereco || !pagamento)){
    alert("Preencha endereço e pagamento");
    return;
  }

  let total = 0;
  carrinho.forEach(p=> total += p.preco * p.qtd);

  // 💰 VALIDAÇÃO TROCO
  if(pagamento === "Dinheiro"){

    if(troco === "" || troco === null){
      alert("Selecione ou informe o troco");
      return;
    }

    if(Number(troco) !== 0 && Number(troco) < total){
      alert("Troco deve ser maior que o total");
      return;
    }
  }

  let numeroPedido = Date.now().toString().slice(-6);

  let agora = new Date();
  let data = agora.toLocaleDateString();
  let hora = agora.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

  let texto = `🧾 *NOVO PEDIDO #${numeroPedido}*\n`;
  texto += `🏪 *Cafofo da Sisi*\n`;
  texto += `📅 ${data} • ${hora}\n\n`;

  texto += "━━━━━━━━━━━━━━━\n";
  texto += "🍔 *ITENS*\n\n";

  carrinho.forEach(p=>{
    texto += `➤ *${p.nome}*\n`;
    texto += `   Qtd: ${p.qtd} | R$ ${p.preco.toFixed(2)}\n\n`;
  });

  texto += "━━━━━━━━━━━━━━━\n";
  texto += `💰 *TOTAL: R$ ${total.toFixed(2).replace(".", ",")}*\n`;
  texto += "━━━━━━━━━━━━━━━\n\n";

  texto += "👤 *CLIENTE*\n";
  texto += `• ${nome}\n`;
  texto += `• ${telefone}\n\n`;

  texto += "📦 *ENTREGA*\n";
  texto += `• Tipo: ${tipo}\n`;

  if(tipo === "Entrega"){
    texto += `• Endereço: ${endereco}\n`;
    texto += `• Pagamento: ${pagamento}\n`;

    if(pagamento === "Dinheiro"){
      if(Number(troco) === 0){
        texto += `• Troco: Não precisa\n`;
      }else{
        texto += `• Troco para: R$ ${Number(troco).toFixed(2)}\n`;
      }
    }
  }

  texto += "\n━━━━━━━━━━━━━━━\n";
  texto += "🚀 Pedido enviado automaticamente";

  // 🚀 ABRE WHATSAPP
  window.open("https://wa.me/5532991933822?text=" + encodeURIComponent(texto));

  // ⏱️ PEQUENO DELAY PRA UX
  setTimeout(() => {

    // 🧹 LIMPA CARRINHO
    limparCarrinho();

    // 🔄 RESET CAMPOS
    document.getElementById("nome").value = "";
    document.getElementById("telefone").value = "";
    document.getElementById("endereco").value = "";
    document.getElementById("pagamento").value = "";
    document.getElementById("tipo").value = "";

    // 🔄 RESET TROCO
    trocoSelecionado = null;
    document.getElementById("trocoInput").value = "";
    document.getElementById("boxTroco").style.display = "none";

    // 🔄 ESCONDE CAMPOS
    document.getElementById("boxEndereco").style.display = "none";
    document.getElementById("boxPagamento").style.display = "none";

  }, 500);
}

// 🧹 LIMPAR
function limparCarrinho(){
  carrinho = [];
  salvar();
}

// 🔎 BUSCAR
function buscar(){
  let termo = document.getElementById("busca").value.toLowerCase();
  render(produtos.filter(p => (p.nome || "").toLowerCase().includes(termo)));
}

// 🔎 BUSCAR AO PRESSIONAR ENTER
document.getElementById("busca").addEventListener("keydown", (e) => {
  if(e.key === "Enter") buscar();
});

// 📂 FILTRAR POR CATEGORIA
function filtrarCategoria(categoria, evt){

  document.querySelectorAll(".filtros button")
    .forEach(btn => btn.classList.remove("ativo"));

  if(evt) evt.currentTarget.classList.add("ativo");

  if(categoria === "todas"){
    render(produtos);
    return;
  }

  render(produtos.filter(p => p.categoria === categoria));
}

// 🚀 START
carregar();
