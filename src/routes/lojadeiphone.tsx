import { createFileRoute, Navigate } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  BellRing,
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Eye,
  FileText,
  Gauge,
  Hammer,
  LayoutGrid,
  Loader2,
  LogOut,
  Package,
  PenLine,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { AppLogo } from "@/components/layout/AppLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/lojadeiphone")({
  head: () => ({
    meta: [
      { title: "Loja de iPhone - Fiado V2" },
      {
        name: "description",
        content: "V2 do Fiado para lojas de iPhone, peças, assistência técnica e cobranças.",
      },
    ],
  }),
  component: LojaDeIphonePage,
});

type TabId =
  | "dashboard"
  | "celulares"
  | "pecas"
  | "servicos"
  | "clientes"
  | "vendas"
  | "emprestimos"
  | "pagamentos"
  | "cobrancas"
  | "estoque"
  | "relatorios"
  | "ia"
  | "configuracoes";

type PhoneStatus =
  | "Disponível"
  | "Vendido"
  | "Reservado"
  | "Em manutenção"
  | "Fiado"
  | "Consignado";
type SaleStatus = "Pago" | "Parcial" | "Em aberto" | "Atrasado";
type ServiceStatus =
  | "Recebido"
  | "Em diagnóstico"
  | "Aguardando peça"
  | "Em manutenção"
  | "Pronto"
  | "Entregue"
  | "Cancelado";

type Phone = {
  id: number;
  productId?: string;
  modelo: string;
  linha: string;
  capacidade: string;
  cor: string;
  estado: string;
  bateria: number;
  imei: string;
  serial: string;
  faceId: string;
  trueTone: string;
  telaOriginal: string;
  bateriaOriginal: string;
  aberto: string;
  bloqueio: string;
  acompanha: string[];
  custoCompra: number;
  custoManutencao: number;
  precoVenda: number;
  status: PhoneStatus;
  observacoes: string;
};

type Part = {
  id: number;
  productId?: string;
  tipo: string;
  modelo: string;
  qualidade: string;
  sku: string;
  fornecedor: string;
  custo: number;
  preco: number;
  precoInstalado: number;
  quantidade: number;
  minimo: number;
  localizacao: string;
  garantia: number;
  status: "Disponível" | "Baixo estoque" | "Sem estoque" | "Reservada" | "Defeituosa";
};

type ServiceOrder = {
  id: number;
  cliente: string;
  whatsapp: string;
  modelo: string;
  imei: string;
  problema: string;
  diagnostico: string;
  servico: string;
  peca: string;
  custoPeca: number;
  maoObra: number;
  entrada: number;
  formaPagamento: string;
  status: ServiceStatus;
  prazo: string;
  garantia: number;
  observacoes: string;
};

type Client = {
  id: number;
  nome: string;
  tipo: "B2C" | "B2B";
  whatsapp: string;
  cpf: string;
  endereco: string;
  compras: number;
  totalComprado: number;
  aberto: number;
  aparelhos: string[];
  servicos: string[];
  pecas: string[];
  status: "Ativo" | "Inadimplente" | "Bloqueado" | "VIP";
  observacoes?: string;
};

type Sale = {
  id: number;
  cliente: string;
  tipo: "Celular" | "Peça" | "Serviço" | "Combo";
  item: string;
  quantidade: number;
  unitario: number;
  desconto: number;
  pagamento: string;
  entrada: number;
  parcelas: number;
  vencimento: string;
  status: SaleStatus;
  lucro: number;
  modalidade?: "avista" | "fiado" | "emprestimo";
  jurosMensal?: number;
  diaCobranca?: number;
  totalProgramado?: number;
  parcelasAgenda?: LoanInstallment[];
};

type LoanForm = {
  cliente: string;
  item: string;
  valor: string;
  entrada: string;
  parcelas: string;
  jurosMensal: string;
  diaCobranca: string;
  primeiraParcela: string;
};

type LoanInstallment = {
  id: number;
  numero: number;
  vencimento: string;
  valor: number;
  status: "pendente" | "pago" | "vencido";
};

type AiCatalogPart = {
  tipo: string;
  modelo: string;
  qualidade: string;
  fornecedor: string;
  custo: number;
  preco: number;
  precoInstalado: number;
  quantidade: number;
  minimo: number;
  localizacao: string;
  garantia: number;
  observacoes?: string;
  precisaRevisao?: boolean;
};

type Payment = {
  id: number;
  cliente: string;
  venda: string;
  valor: number;
  forma: string;
  data: string;
  observacoes: string;
};

type FiadoAiRequest = {
  mode: "duvida" | "catalogo";
  prompt: string;
  appContext: {
    phones: number;
    parts: number;
    clients: number;
    sales: number;
    services: number;
  };
};

type FiadoAiResponse = {
  answer: string;
  questions: string[];
  parts: AiCatalogPart[];
};

type StockKind = "Aparelho" | "Acessório" | "Peça";

type StockProductForm = {
  kind: StockKind;
  codigo: string;
  tipo: string;
  sku: string;
  dataEntrada: string;
  nome: string;
  categoria: string;
  marca: string;
  modelo: string;
  imei: string;
  imei2: string;
  serial: string;
  codigoBarras: string;
  disponibilidade: string;
  cor: string;
  gb: string;
  memoriaRam: string;
  subcategoria: string;
  quantidade: string;
  quantidadeMinima: string;
  valorCusto: string;
  valorVenda: string;
  diasGarantia: string;
  fornecedor: string;
  observacao: string;
  tags: string;
  cest: string;
  ncm: string;
  origem: string;
  cst: string;
  cfopSaidaEstadual: string;
  cfopSaidaInterestadual: string;
  cfopEntradaEstadual: string;
  cfopEntradaInterestadual: string;
  tributacao: string;
};

type InventoryProductRow = {
  id: string;
  nome: string;
  sku: string | null;
  preco_venda: number;
  quantidade: number;
  estoque_minimo: number;
  status: string;
  observacoes: string | null;
};

type LojaInventoryMeta =
  | {
      app: "lojadeiphone";
      version: 1;
      kind: "phone";
      data: Omit<Phone, "id" | "productId">;
    }
  | {
      app: "lojadeiphone";
      version: 1;
      kind: "part";
      data: Omit<Part, "id" | "productId">;
    };

type ImeiCheckResult = {
  imei: string;
  checkedAt: string;
  certificateId: string;
  source: "ImeiCheck TAC publico" | "IMEI.EU API" | "Pre-check local";
  status: "Aprovado" | "Atenção" | "Pre-check";
  brand?: string;
  model?: string;
  name?: string;
  blacklisted?: boolean | null;
  notes: string[];
};

const tabs: { id: TabId; label: string; icon: typeof LayoutGrid }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { id: "celulares", label: "Celulares", icon: Smartphone },
  { id: "pecas", label: "Peças", icon: Package },
  { id: "servicos", label: "Serviços", icon: Wrench },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "vendas", label: "Vendas", icon: BadgeDollarSign },
  { id: "emprestimos", label: "Emprestimos", icon: Wallet },
  { id: "pagamentos", label: "Pagamentos", icon: CreditCard },
  { id: "cobrancas", label: "Cobranças", icon: BellRing },
  { id: "estoque", label: "Estoque", icon: Boxes },
  { id: "relatorios", label: "Relatórios", icon: BarChart3 },
  { id: "ia", label: "IA", icon: Sparkles },
  { id: "configuracoes", label: "Configurações", icon: Settings },
];

const iphoneModels = [
  "iPhone 17e",
  "iPhone 17 Pro Max",
  "iPhone 17 Pro",
  "iPhone 17",
  "iPhone Air",
  "iPhone 16e",
  "iPhone 16 Pro Max",
  "iPhone 16 Pro",
  "iPhone 16 Plus",
  "iPhone 16",
  "iPhone 15 Pro Max",
  "iPhone 15 Pro",
  "iPhone 15 Plus",
  "iPhone 15",
  "iPhone 14 Pro Max",
  "iPhone 14 Pro",
  "iPhone 14 Plus",
  "iPhone 14",
  "iPhone SE 3ª geração",
  "iPhone 13 Pro Max",
  "iPhone 13 Pro",
  "iPhone 13",
  "iPhone 13 mini",
  "iPhone 12 Pro Max",
  "iPhone 12 Pro",
  "iPhone 12",
  "iPhone 12 mini",
  "iPhone SE 2ª geração",
  "iPhone 11 Pro Max",
  "iPhone 11 Pro",
  "iPhone 11",
  "iPhone XS Max",
  "iPhone XS",
  "iPhone XR",
  "iPhone X",
  "iPhone 8 Plus",
  "iPhone 8",
  "iPhone 7 Plus",
  "iPhone 7",
  "iPhone SE 1ª geração",
  "iPhone 6s Plus",
  "iPhone 6s",
  "iPhone 6 Plus",
  "iPhone 6",
  "iPhone 5s",
  "iPhone 5c",
  "iPhone 5",
  "iPhone 4s",
  "iPhone 4",
  "iPhone 3GS",
  "iPhone 3G",
  "iPhone original",
];

const iphoneColorFallback = [
  "Preto",
  "Branco",
  "Azul",
  "Rosa",
  "Verde",
  "Amarelo",
  "Vermelho",
  "Roxo",
  "Dourado",
  "Prateado",
  "Grafite",
  "Titanio natural",
  "Titanio azul",
  "Titanio preto",
  "Titanio branco",
];

const iphoneColorOptions = (model: string) => {
  const normalized = model.toLowerCase();
  if (!normalized) return iphoneColorFallback;
  if (normalized.includes("air"))
    return ["Azul ceu", "Dourado claro", "Branco nuvem", "Preto espacial"];
  if (normalized.includes("17 pro"))
    return ["Titanio natural", "Titanio azul", "Titanio preto", "Titanio branco"];
  if (normalized.includes("17")) return ["Preto", "Branco", "Azul", "Rosa", "Verde"];
  if (normalized.includes("16 pro"))
    return ["Titanio preto", "Titanio branco", "Titanio natural", "Titanio deserto"];
  if (normalized.includes("16e")) return ["Preto", "Branco"];
  if (normalized.includes("16"))
    return ["Preto", "Branco", "Rosa", "Verde ultramarino", "Azul petróleo"];
  if (normalized.includes("15 pro"))
    return ["Titanio natural", "Titanio azul", "Titanio branco", "Titanio preto"];
  if (normalized.includes("15")) return ["Preto", "Azul", "Verde", "Amarelo", "Rosa"];
  if (normalized.includes("14 pro"))
    return ["Preto espacial", "Prateado", "Dourado", "Roxo profundo"];
  if (normalized.includes("14"))
    return ["Meia-noite", "Estelar", "Azul", "Roxo", "Amarelo", "Vermelho"];
  if (normalized.includes("13 pro"))
    return ["Grafite", "Dourado", "Prateado", "Azul sierra", "Verde alpino"];
  if (normalized.includes("13"))
    return ["Meia-noite", "Estelar", "Azul", "Rosa", "Verde", "Vermelho"];
  if (normalized.includes("12 pro")) return ["Grafite", "Prateado", "Dourado", "Azul pacifico"];
  if (normalized.includes("12")) return ["Preto", "Branco", "Azul", "Verde", "Roxo", "Vermelho"];
  if (normalized.includes("11 pro"))
    return ["Cinza espacial", "Prateado", "Dourado", "Verde meia-noite"];
  if (normalized.includes("11")) return ["Preto", "Branco", "Roxo", "Verde", "Amarelo", "Vermelho"];
  if (normalized.includes("xr")) return ["Preto", "Branco", "Azul", "Amarelo", "Coral", "Vermelho"];
  if (normalized.includes("xs")) return ["Cinza espacial", "Prateado", "Dourado"];
  if (normalized.includes("x")) return ["Cinza espacial", "Prateado"];
  if (normalized.includes("8")) return ["Cinza espacial", "Prateado", "Dourado", "Vermelho"];
  if (normalized.includes("7"))
    return ["Preto", "Preto brilhante", "Prateado", "Dourado", "Ouro rosa", "Vermelho"];
  if (normalized.includes("se")) return ["Meia-noite", "Estelar", "Vermelho", "Preto", "Branco"];
  if (normalized.includes("6")) return ["Cinza espacial", "Prateado", "Dourado", "Ouro rosa"];
  if (normalized.includes("5c")) return ["Branco", "Rosa", "Amarelo", "Azul", "Verde"];
  if (normalized.includes("5")) return ["Preto", "Branco", "Cinza espacial", "Prateado", "Dourado"];
  if (normalized.includes("4")) return ["Preto", "Branco"];
  return iphoneColorFallback;
};

const partTypes = [
  "Bateria",
  "Tela frontal",
  "Display OLED",
  "Display LCD/Incell",
  "Touch",
  "Vidro frontal",
  "Tampa traseira",
  "Vidro traseiro",
  "Carcaça",
  "Aro lateral",
  "Lente da câmera traseira",
  "Câmera traseira",
  "Câmera frontal",
  "Sensor de proximidade",
  "Flex do Face ID",
  "Flex do botão power",
  "Flex do botão volume",
  "Flex do botão silencioso",
  "Flex de carga",
  "Dock de carga",
  "Conector de carga Lightning",
  "Conector de carga USB-C",
  "Microfone",
  "Alto-falante auricular",
  "Alto-falante viva-voz/campainha",
  "Taptic Engine/vibracall",
  "Bandeja SIM",
  "Botão home",
  "Touch ID",
  "Placa lógica",
  "Placa de carga",
  "Antena",
  "Cabo coaxial",
  "Parafusos",
  "Blindagem metálica",
  "Adesivo de vedação da tela",
  "Adesivo da bateria",
  "Película",
  "Capinha",
  "Cabo",
  "Carregador",
  "Conector interno",
  "Sensor de luz",
  "Módulo Wi-Fi/Bluetooth",
  "Módulo TrueDepth",
  "Flash",
  "Scanner LiDAR",
  "Suporte de câmera",
  "Grade auricular",
  "Malha de alto-falante",
];

const partQualityOptions = [
  "Original Apple",
  "Original retirada",
  "Premium",
  "OLED",
  "Incell",
  "Nacional",
  "Paralela",
  "Recondicionada",
];

const fiadoAiSystemPrompt = `Voce e a IA oficial do SaaS Fiado V2 para loja de iPhone. Responda como um especialista de produto, claro, direto e util.

Manual interno do app:
- Rota principal /lojadeiphone e uma V2 para lojas de iPhone, pecas, assistencia tecnica, fiado, emprestimos, pagamentos, cobrancas, estoque e relatorios.
- Dashboard mostra total vendido, recebido, fiado, lucro, clientes em aberto, estoque baixo, servicos em andamento e aparelhos disponiveis.
- Aba Celulares cadastra iPhone completo: modelo, capacidade, cor, estado, bateria, IMEI, serial, Face ID, True Tone, tela/bateria original, bloqueio, acessorios, custos, preco e status. O cadastro manual de aparelho e feito um por vez pelo botao + Adicionar iPhone.
- Aba Pecas cadastra pecas por tipo, modelo compativel, qualidade, fornecedor, custo, preco, estoque, minimo, localizacao e garantia. A IA pode transformar uma lista grande de pecas em itens revisaveis para estoque.
- Aba Servicos cria ordem de servico para assistencia tecnica.
- Aba Clientes cadastra B2C venda final e B2B revenda, individualmente ou por lista.
- Aba Vendas tem modos A vista, Fiado e Emprestimo, com entrada, parcelas e baixa de estoque.
- Aba Emprestimos registra peca ou celular emprestado, cria parcelas, entra em Cobrancas e permite validar pagamento.
- Aba Cobrancas mostra hoje/todas, vencidas, WhatsApp, pagar e renegociar.
- Aba Estoque consolida celulares, pecas e acessorios.
- Aba Relatorios resume faturamento, margem, itens vendidos, inadimplencia e estoque.
- Aba IA tira duvidas sobre o app e preenche catalogo de pecas para revisar antes de importar.

Regras:
- Se o usuario fizer uma pergunta sobre como usar o app, responda a pergunta diretamente, sem pedir mais contexto se a resposta estiver no manual.
- Se perguntar limite/quantidade, explique o limite pratico da tela atual.
- Se o modo for catalogo, extraia itens de estoque de listas soltas e pergunte quando faltar modelo, preco, qualidade, quantidade, fornecedor ou localizacao.
- Nunca invente que uma funcionalidade ja salva no banco se o contexto nao disser isso; diga "na tela atual" quando for comportamento de interface.
- Responda em JSON puro no formato:
{
  "answer": "resposta em portugues",
  "questions": ["perguntas objetivas se faltar dado"],
  "parts": [{
    "tipo": "tipo de peca",
    "modelo": "modelo de iPhone compativel",
    "qualidade": "Original Apple | Original retirada | Premium | OLED | Incell | Nacional | Paralela | Recondicionada",
    "fornecedor": "fornecedor ou vazio",
    "custo": 0,
    "preco": 0,
    "precoInstalado": 0,
    "quantidade": 1,
    "minimo": 1,
    "localizacao": "gaveta/caixa/prateleira ou vazio",
    "garantia": 30,
    "observacoes": "detalhes",
    "precisaRevisao": true
  }]
}`;

const askFiadoAIServer = createServerFn({ method: "POST" })
  .inputValidator((data: FiadoAiRequest) => data)
  .handler(async ({ data }): Promise<FiadoAiResponse> => {
    const localParts =
      data.mode === "catalogo" ? sanitizeAiParts(parseCatalogText(data.prompt)) : [];
    const localAnswer = localFiadoAnswer(data.mode, localParts.length, data.prompt);

    try {
      const response = await fetch("https://text.pollinations.ai/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai",
          messages: [
            { role: "system", content: fiadoAiSystemPrompt },
            {
              role: "user",
              content: JSON.stringify({
                mode: data.mode,
                prompt: data.prompt,
                appContext: data.appContext,
              }),
            },
          ],
          temperature: 0.15,
        }),
      });

      if (!response.ok) throw new Error(`AI status ${response.status}`);
      const payload = await response.json();
      const content = payload?.choices?.[0]?.message?.content ?? "";
      const parsed = parseAiJson(content);
      const parts = sanitizeAiParts(parsed.parts?.length ? parsed.parts : localParts);

      return {
        answer: parsed.answer || localAnswer,
        questions: parsed.questions?.length ? parsed.questions : buildAiQuestions(parts),
        parts,
      };
    } catch {
      return {
        answer: localAnswer,
        questions: buildAiQuestions(localParts),
        parts: localParts,
      };
    }
  });

const serviceTypes = [
  "Troca de bateria",
  "Troca de tela",
  "Troca de vidro traseiro",
  "Troca de tampa traseira",
  "Troca de câmera traseira",
  "Troca de câmera frontal",
  "Troca de lente da câmera",
  "Troca de conector de carga",
  "Troca de alto-falante",
  "Troca de auricular",
  "Troca de microfone",
  "Troca de botão power",
  "Troca de botão volume",
  "Reparo de Face ID",
  "Reparo de placa",
  "Limpeza interna",
  "Diagnóstico técnico",
  "Atualização/restauração",
  "Remoção de oxidação",
  "Instalação de película",
  "Instalação de capinha",
  "Venda de acessório",
];

const seedPhones: Phone[] = [
  {
    id: 1,
    modelo: "iPhone 11",
    linha: "11",
    capacidade: "128GB",
    cor: "Preto",
    estado: "Seminovo",
    bateria: 86,
    imei: "356789110000001",
    serial: "F2LIP11PRETO",
    faceId: "Sim",
    trueTone: "Sim",
    telaOriginal: "Não sei",
    bateriaOriginal: "Sim",
    aberto: "Não sei",
    bloqueio: "Desbloqueado",
    acompanha: ["Cabo", "Película"],
    custoCompra: 1250,
    custoManutencao: 80,
    precoVenda: 1890,
    status: "Disponível",
    observacoes: "Aparelho vitrine, leve marca lateral.",
  },
  {
    id: 2,
    modelo: "iPhone 13",
    linha: "13",
    capacidade: "128GB",
    cor: "Azul",
    estado: "Usado",
    bateria: 91,
    imei: "356789130000002",
    serial: "H9KIP13AZUL",
    faceId: "Sim",
    trueTone: "Sim",
    telaOriginal: "Sim",
    bateriaOriginal: "Sim",
    aberto: "Não",
    bloqueio: "Desbloqueado",
    acompanha: ["Caixa", "Cabo"],
    custoCompra: 2100,
    custoManutencao: 0,
    precoVenda: 2850,
    status: "Vendido",
    observacoes: "Vendido no Pix.",
  },
  {
    id: 3,
    modelo: "iPhone 14 Pro Max",
    linha: "14 Pro",
    capacidade: "256GB",
    cor: "Roxo",
    estado: "Vitrine",
    bateria: 95,
    imei: "356789140000003",
    serial: "J8P14PMROXO",
    faceId: "Sim",
    trueTone: "Sim",
    telaOriginal: "Sim",
    bateriaOriginal: "Sim",
    aberto: "Não",
    bloqueio: "Desbloqueado",
    acompanha: ["Caixa", "Cabo", "Capinha"],
    custoCompra: 4200,
    custoManutencao: 120,
    precoVenda: 5390,
    status: "Reservado",
    observacoes: "Reservado para retirada amanhã.",
  },
];

const seedParts: Part[] = [
  {
    id: 1,
    tipo: "Bateria",
    modelo: "iPhone 11",
    qualidade: "Premium",
    sku: "BAT-IP11-PRE",
    fornecedor: "TechParts SP",
    custo: 78,
    preco: 149,
    precoInstalado: 249,
    quantidade: 5,
    minimo: 2,
    localizacao: "Gaveta A1",
    garantia: 90,
    status: "Disponível",
  },
  {
    id: 2,
    tipo: "Tela frontal",
    modelo: "iPhone 11",
    qualidade: "Incell",
    sku: "TELA-IP11-INC",
    fornecedor: "Mobile Prime",
    custo: 155,
    preco: 289,
    precoInstalado: 429,
    quantidade: 3,
    minimo: 2,
    localizacao: "Caixa T2",
    garantia: 60,
    status: "Disponível",
  },
  {
    id: 3,
    tipo: "Display OLED",
    modelo: "iPhone 12",
    qualidade: "OLED",
    sku: "OLED-IP12",
    fornecedor: "iFix Brasil",
    custo: 270,
    preco: 449,
    precoInstalado: 649,
    quantidade: 2,
    minimo: 2,
    localizacao: "Caixa O1",
    garantia: 90,
    status: "Baixo estoque",
  },
  {
    id: 4,
    tipo: "Tampa traseira",
    modelo: "iPhone 14 Pro Max",
    qualidade: "Original retirada",
    sku: "TR-IP14PM-ROXO",
    fornecedor: "RetiraMax",
    custo: 180,
    preco: 349,
    precoInstalado: 499,
    quantidade: 1,
    minimo: 2,
    localizacao: "Prateleira P3",
    garantia: 30,
    status: "Baixo estoque",
  },
];

const seedClients: Client[] = [
  {
    id: 1,
    nome: "João Silva",
    whatsapp: "1199999-1001",
    cpf: "",
    endereco: "Centro",
    compras: 3,
    totalComprado: 2940,
    aberto: 350,
    aparelhos: ["iPhone 11 128GB"],
    servicos: ["Troca de bateria"],
    pecas: ["Película iPhone 11"],
    status: "Inadimplente",
  },
  {
    id: 2,
    nome: "Maria Santos",
    whatsapp: "1199999-1002",
    cpf: "",
    endereco: "Jardim América",
    compras: 2,
    totalComprado: 860,
    aberto: 0,
    aparelhos: [],
    servicos: ["Troca de tela iPhone 12"],
    pecas: ["Capinha"],
    status: "VIP",
  },
];

const seedServices: ServiceOrder[] = [
  {
    id: 1,
    cliente: "Maria Santos",
    whatsapp: "1199999-1002",
    modelo: "iPhone 12",
    imei: "356789120000004",
    problema: "Tela piscando e toque falhando.",
    diagnostico: "Display danificado, sem dano em placa.",
    servico: "Troca de tela",
    peca: "Display OLED iPhone 12",
    custoPeca: 270,
    maoObra: 180,
    entrada: 150,
    formaPagamento: "Entrada + parcelas",
    status: "Pronto",
    prazo: "2026-05-14",
    garantia: 90,
    observacoes: "Pronto para entrega.",
  },
  {
    id: 2,
    cliente: "João Silva",
    whatsapp: "1199999-1001",
    modelo: "iPhone 11",
    imei: "356789110000001",
    problema: "Bateria descarregando rápido.",
    diagnostico: "Saúde baixa e ciclos altos.",
    servico: "Troca de bateria",
    peca: "Bateria iPhone 11",
    custoPeca: 78,
    maoObra: 120,
    entrada: 100,
    formaPagamento: "Fiado",
    status: "Em manutenção",
    prazo: "2026-05-13",
    garantia: 90,
    observacoes: "Cliente pediu entrega no fim do dia.",
  },
];

const seedSales: Sale[] = [
  {
    id: 1,
    cliente: "João Silva",
    tipo: "Serviço",
    item: "Troca de bateria iPhone 11",
    quantidade: 1,
    unitario: 450,
    desconto: 0,
    pagamento: "Fiado",
    entrada: 100,
    parcelas: 2,
    vencimento: "2026-05-20",
    status: "Em aberto",
    lucro: 252,
  },
  {
    id: 2,
    cliente: "Maria Santos",
    tipo: "Peça",
    item: "Tela iPhone 12 OLED instalada",
    quantidade: 1,
    unitario: 650,
    desconto: 40,
    pagamento: "Pix",
    entrada: 610,
    parcelas: 1,
    vencimento: "2026-05-12",
    status: "Pago",
    lucro: 340,
  },
  {
    id: 3,
    cliente: "Cliente balcão",
    tipo: "Celular",
    item: "iPhone 13 128GB Azul",
    quantidade: 1,
    unitario: 2850,
    desconto: 0,
    pagamento: "Cartão",
    entrada: 2850,
    parcelas: 1,
    vencimento: "2026-05-12",
    status: "Pago",
    lucro: 750,
  },
];

const seedPayments: Payment[] = [
  {
    id: 1,
    cliente: "Maria Santos",
    venda: "Tela iPhone 12 OLED instalada",
    valor: 610,
    forma: "Pix",
    data: "2026-05-12",
    observacoes: "Comprovante conferido.",
  },
  {
    id: 2,
    cliente: "Cliente balcão",
    venda: "iPhone 13 128GB Azul",
    valor: 2850,
    forma: "Cartão",
    data: "2026-05-12",
    observacoes: "Crédito 1x.",
  },
];

const today = "2026-05-13";

const emptyStockProductForm: StockProductForm = {
  kind: "Peça",
  codigo: "",
  tipo: "",
  sku: "",
  dataEntrada: today,
  nome: "",
  categoria: "",
  marca: "Apple",
  modelo: "iPhone 11",
  imei: "",
  imei2: "",
  serial: "",
  codigoBarras: "",
  disponibilidade: "Disponível para venda",
  cor: "",
  gb: "128GB",
  memoriaRam: "",
  subcategoria: "",
  quantidade: "1",
  quantidadeMinima: "",
  valorCusto: "",
  valorVenda: "",
  diasGarantia: "",
  fornecedor: "",
  observacao: "",
  tags: "",
  cest: "",
  ncm: "",
  origem: "",
  cst: "",
  cfopSaidaEstadual: "",
  cfopSaidaInterestadual: "",
  cfopEntradaEstadual: "",
  cfopEntradaInterestadual: "",
  tributacao: "",
};

function LojaDeIphonePage() {
  const { session, loading, signOut, user } = useAuth();
  const askFiadoAI = useServerFn(askFiadoAIServer);
  const [active, setActive] = useState<TabId>("dashboard");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [phones, setPhones] = useState<Phone[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [services, setServices] = useState<ServiceOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [aiMode, setAiMode] = useState<"duvida" | "catalogo">("catalogo");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [aiDraftParts, setAiDraftParts] = useState<AiCatalogPart[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [newClient, setNewClient] = useState({
    nome: "",
    tipo: "B2C" as Client["tipo"],
    whatsapp: "",
    documento: "",
    endereco: "",
    observacoes: "",
  });
  const [clientListText, setClientListText] = useState("");
  const [newPhone, setNewPhone] = useState({ modelo: "iPhone 11", capacidade: "128GB", cor: "" });
  const [newPart, setNewPart] = useState({ tipo: "Bateria", modelo: "iPhone 11", quantidade: "1" });
  const [stockProduct, setStockProduct] = useState<StockProductForm>(emptyStockProductForm);
  const [stockProductOpen, setStockProductOpen] = useState(false);
  const [imeiQuery, setImeiQuery] = useState("");
  const [imeiApiKey, setImeiApiKey] = useState(() =>
    typeof window === "undefined" ? "" : localStorage.getItem("fiado-imei-api-key") || "",
  );
  const [imeiResult, setImeiResult] = useState<ImeiCheckResult | null>(null);
  const [checkingImei, setCheckingImei] = useState(false);
  const [newService, setNewService] = useState({
    cliente: "",
    modelo: "iPhone 11",
    servico: "Troca de bateria",
  });
  const [newSale, setNewSale] = useState({
    cliente: "",
    tipo: "Peça" as Sale["tipo"],
    item: "",
    valor: "",
    entrada: "",
    parcelas: "1",
    modalidade: "fiado" as NonNullable<Sale["modalidade"]>,
    jurosMensal: "0",
    diaCobranca: "20",
    primeiraParcela: "2026-06-20",
  });
  const [newLoan, setNewLoan] = useState<LoanForm>({
    cliente: "",
    item: "",
    valor: "",
    entrada: "",
    parcelas: "1",
    jurosMensal: "0",
    diaCobranca: "20",
    primeiraParcela: "2026-06-20",
  });

  const firstName =
    user?.user_metadata?.nome?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "Andre";
  const email = user?.email ?? "andre@lojaiphone.com";
  const initials = firstName.slice(0, 1).toUpperCase();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;

    let activeRequest = true;
    setInventoryLoading(true);

    supabase
      .from("products")
      .select("id,nome,sku,preco_venda,quantidade,estoque_minimo,status,observacoes")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!activeRequest) return;
        if (error) {
          toast.error("Nao consegui carregar o estoque salvo da sua conta");
          return;
        }

        const rows = (data ?? []) as InventoryProductRow[];
        const loadedPhones: Phone[] = [];
        const loadedParts: Part[] = [];

        rows.forEach((row) => {
          const parsed = parseInventoryProduct(row);
          if (!parsed) return;
          if (parsed.kind === "phone") loadedPhones.push(parsed.item);
          if (parsed.kind === "part") loadedParts.push(parsed.item);
        });

        setPhones(loadedPhones);
        setParts(loadedParts);
      })
      .finally(() => {
        if (activeRequest) setInventoryLoading(false);
      });

    return () => {
      activeRequest = false;
    };
  }, [userId]);

  const totals = useMemo(() => {
    const totalVendido = sales.reduce(
      (acc, item) => acc + item.unitario * item.quantidade - item.desconto,
      0,
    );
    const totalRecebido = payments.reduce((acc, item) => acc + item.valor, 0);
    const totalFiado = sales.reduce(
      (acc, item) =>
        acc + Math.max(item.unitario * item.quantidade - item.desconto - item.entrada, 0),
      0,
    );
    const lowStock = parts.filter((item) => item.quantidade <= item.minimo);
    const availablePhones = phones.filter((item) => item.status.startsWith("Dispon")).length;
    const openClients = clients.filter((item) => item.aberto > 0).length;
    const activeServices = services.filter((item) =>
      ["Recebido", "Em diagnóstico", "Aguardando peça", "Em manutenção", "Pronto"].includes(
        item.status,
      ),
    );
    return {
      totalVendido,
      totalRecebido,
      totalFiado,
      lowStock,
      availablePhones,
      openClients,
      activeServices,
      lucro: sales.reduce((acc, item) => acc + item.lucro, 0),
      estoqueParado:
        phones
          .filter((item) => item.status !== "Vendido")
          .reduce((acc, item) => acc + item.custoCompra + item.custoManutencao, 0) +
        parts.reduce((acc, item) => acc + item.custo * item.quantidade, 0),
      lucroPotencial:
        phones
          .filter((item) => item.status !== "Vendido")
          .reduce(
            (acc, item) => acc + (item.precoVenda - item.custoCompra - item.custoManutencao),
            0,
          ) + parts.reduce((acc, item) => acc + (item.preco - item.custo) * item.quantidade, 0),
    };
  }, [clients, parts, payments, phones, sales, services]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" />;

  const filteredPhones = phones.filter((item) =>
    matchesFilters(
      [item.modelo, item.imei, item.serial, item.status, item.cor],
      query,
      statusFilter,
      item.status,
    ),
  );
  const filteredParts = parts.filter(
    (item) =>
      matchesFilters(
        [item.tipo, item.modelo, item.qualidade, item.sku, item.fornecedor, item.status],
        query,
        statusFilter,
        item.status,
      ) &&
      (categoryFilter === "Todos" ||
        item.tipo === categoryFilter ||
        item.modelo === categoryFilter),
  );
  const filteredServices = services.filter((item) =>
    matchesFilters(
      [item.cliente, item.modelo, item.imei, item.problema, item.servico, item.status],
      query,
      statusFilter,
      item.status,
    ),
  );
  const filteredClients = clients.filter(
    (item) =>
      matchesFilters(
        [item.nome, item.tipo, item.whatsapp, item.cpf, item.status, item.observacoes ?? ""],
        query,
        statusFilter,
        item.status,
      ) &&
      (categoryFilter === "Todos" || item.tipo === categoryFilter),
  );
  const filteredSales = sales.filter(
    (item) =>
      matchesFilters(
        [item.cliente, item.item, item.tipo, item.status],
        query,
        statusFilter,
        item.status,
      ) &&
      (categoryFilter === "Todos" || item.tipo === categoryFilter),
  );
  const filteredLoans = sales.filter(
    (item) =>
      item.modalidade === "emprestimo" &&
      matchesFilters(
        [item.cliente, item.item, item.tipo, item.status],
        query,
        statusFilter,
        item.status,
      ),
  );
  const loanItemOptions = [
    ...parts.map((part) => `${part.tipo} ${part.modelo}`),
    ...phones
      .filter((phone) => phone.status !== "Vendido")
      .map((phone) => `${phone.modelo} ${phone.capacidade} ${phone.cor}`),
  ];
  const filteredPayments = payments.filter((item) =>
    searchIn([item.cliente, item.venda, item.forma, item.data], query),
  );
  const charges = sales.flatMap((sale) => {
    if (sale.parcelasAgenda?.length) {
      return sale.parcelasAgenda
        .filter((installment) => installment.status !== "pago")
        .map((installment) => ({
          id: sale.id,
          installmentId: installment.id,
          cliente: sale.cliente,
          item: `${sale.item} - parcela ${installment.numero}/${sale.parcelas}`,
          tipo: sale.tipo,
          status: installment.vencimento < today ? "Atrasado" : sale.status,
          vencimento: installment.vencimento,
          aberto: installment.valor,
          atraso: installment.vencimento < today,
        }));
    }

    if (sale.status === "Pago") return [];
    return [
      {
        id: sale.id,
        installmentId: null,
        cliente: sale.cliente,
        item: sale.item,
        tipo: sale.tipo,
        status: sale.status,
        vencimento: sale.vencimento,
        aberto: Math.max(sale.unitario * sale.quantidade - sale.desconto - sale.entrada, 0),
        atraso: sale.vencimento < today,
      },
    ];
  });
  const filteredCharges = charges.filter(
    (item) =>
      matchesFilters(
        [item.cliente, item.item, item.status, item.vencimento],
        query,
        statusFilter,
        item.atraso ? "Atrasado" : item.status,
      ) &&
      (categoryFilter === "Todos" || categoryFilter === "Todas" || item.vencimento === today),
  );
  const saleValuePreview = Number(newSale.valor) || 0;
  const saleEntryPreview = Number(newSale.entrada) || 0;
  const loanInstallmentsPreview = Math.max(1, Number(newSale.parcelas) || 1);
  const loanInterestPreview = Math.max(0, Number(newSale.jurosMensal) || 0);
  const loanBalancePreview = Math.max(saleValuePreview - saleEntryPreview, 0);
  const loanProgrammedTotalPreview =
    newSale.modalidade === "emprestimo"
      ? Number(
          (
            loanBalancePreview *
            (1 + (loanInterestPreview / 100) * loanInstallmentsPreview)
          ).toFixed(2),
        )
      : loanBalancePreview;
  const loanSchedulePreview =
    newSale.modalidade === "emprestimo" && loanBalancePreview > 0
      ? buildLoanSchedule({
          firstDueDate:
            newSale.primeiraParcela || nextDueDate(today, Number(newSale.diaCobranca) || 20),
          chargeDay: Number(newSale.diaCobranca) || 20,
          count: loanInstallmentsPreview,
          total: loanProgrammedTotalPreview,
        })
      : [];
  const loanFormValuePreview = Number(newLoan.valor) || 0;
  const loanFormEntryPreview = Number(newLoan.entrada) || 0;
  const loanFormInstallmentsPreview = Math.max(1, Number(newLoan.parcelas) || 1);
  const loanFormInterestPreview = Math.max(0, Number(newLoan.jurosMensal) || 0);
  const loanFormChargeDayPreview = Math.min(31, Math.max(1, Number(newLoan.diaCobranca) || 20));
  const loanFormBalancePreview = Math.max(loanFormValuePreview - loanFormEntryPreview, 0);
  const loanFormProgrammedTotalPreview = Number(
    (
      loanFormBalancePreview *
      (1 + (loanFormInterestPreview / 100) * loanFormInstallmentsPreview)
    ).toFixed(2),
  );
  const loanFormSchedulePreview =
    loanFormBalancePreview > 0
      ? buildLoanSchedule({
          firstDueDate: newLoan.primeiraParcela || nextDueDate(today, loanFormChargeDayPreview),
          chargeDay: loanFormChargeDayPreview,
          count: loanFormInstallmentsPreview,
          total: loanFormProgrammedTotalPreview,
        })
      : [];

  function resetFilters(tab: TabId) {
    setActive(tab);
    setQuery("");
    setStatusFilter("Todos");
    setCategoryFilter("Todos");
  }

  function focusSection(sectionId: string) {
    window.requestAnimationFrame(() => {
      const section = document.getElementById(sectionId);
      section?.scrollIntoView({ behavior: "smooth", block: "start" });
      const firstField = section?.querySelector<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >("input:not([readonly]), select, textarea");
      window.setTimeout(() => firstField?.focus(), 360);
    });
  }

  function openStockProductForm(kind: StockKind) {
    const isPhone = kind === "Aparelho";
    const isAccessory = kind.includes("Acess");
    setStockProduct({
      ...emptyStockProductForm,
      kind,
      tipo: isPhone ? "Celular" : isAccessory ? "Capinha" : "Bateria",
      nome: "",
      categoria: isPhone ? "Seminovo" : "Premium",
      modelo: isAccessory ? "" : "iPhone 11",
      quantidadeMinima: isPhone ? "0" : "2",
      diasGarantia: isPhone ? "90" : "30",
      disponibilidade: emptyStockProductForm.disponibilidade,
    });
    setStockProductOpen(true);
    window.requestAnimationFrame(() => focusSection("iphone-stock-product-form"));
  }

  function startPrimaryFlow() {
    if (active === "celulares") {
      openStockProductForm("Aparelho");
      toast.success("Cadastro completo de iPhone pronto para preencher");
      return;
    }

    if (active === "pecas") {
      openStockProductForm(emptyStockProductForm.kind);
      toast.success("Cadastro completo de peca pronto para preencher");
      return;
    }

    if (active === "estoque") {
      openStockProductForm("Aparelho");
      toast.success("Cadastro de estoque pronto para preencher");
      return;
    }

    if (active === "servicos") {
      focusSection("iphone-service-form");
      toast.success("Ordem de serviço pronta para preencher");
      return;
    }

    if (active === "clientes") {
      focusSection("iphone-client-form");
      toast.success("Cadastro de cliente pronto para preencher");
      return;
    }

    if (active === "vendas") {
      focusSection("iphone-sale-form");
      toast.success("Venda pronta para preencher");
      return;
    }

    if (active === "emprestimos") {
      focusSection("iphone-loan-form");
      toast.success("Registro de emprestimo pronto para preencher");
      return;
    }

    if (active === "ia") {
      focusSection("iphone-ai-assistant");
      toast.success("IA pronta para receber sua lista ou duvida");
    }
  }

  function addPhone() {
    const phone: Phone = {
      id: Date.now(),
      modelo: newPhone.modelo,
      linha: newPhone.modelo.replace("iPhone ", ""),
      capacidade: newPhone.capacidade,
      cor: newPhone.cor || "Preto",
      estado: "Seminovo",
      bateria: 90,
      imei: `IMEI-${Date.now().toString().slice(-6)}`,
      serial: `SN-${Date.now().toString().slice(-6)}`,
      faceId: "Sim",
      trueTone: "Sim",
      telaOriginal: "Não sei",
      bateriaOriginal: "Não sei",
      aberto: "Não sei",
      bloqueio: "Desbloqueado",
      acompanha: ["Cabo"],
      custoCompra: 0,
      custoManutencao: 0,
      precoVenda: 0,
      status: "Disponível",
      observacoes: "Cadastro rápido. Complete os detalhes no editar.",
    };
    setPhones((items) => [phone, ...items]);
    toast.success("Celular cadastrado");
  }

  async function lookupImei() {
    const imei = onlyDigits(imeiQuery);
    if (!isValidImei(imei)) {
      toast.error("IMEI inválido. Confira os 15 dígitos antes de consultar.");
      return;
    }

    setCheckingImei(true);
    const baseResult: ImeiCheckResult = {
      imei,
      checkedAt: new Date().toLocaleString("pt-BR"),
      certificateId: `FIADO-${imei.slice(-6)}-${Date.now().toString().slice(-4)}`,
      source: "Pre-check local",
      status: "Pre-check",
      blacklisted: null,
      notes: [
        "IMEI passou na validação matemática Luhn.",
        "O sistema tenta primeiro uma consulta publica de marca/modelo. Blacklist completa pode exigir provedor com chave.",
      ],
    };

    try {
      try {
        const publicTacParams = new URLSearchParams({ imei, format: "json" });
        const publicTacResponse = await fetch(
          `https://alpha.imeicheck.com/api/modelBrandName?${publicTacParams.toString()}`,
        );

        if (publicTacResponse.ok) {
          const publicTacJson = await publicTacResponse.json();
          const brand =
            publicTacJson.brand ||
            publicTacJson.Brand ||
            publicTacJson.manufacturer ||
            publicTacJson.Manufacturer;
          const model =
            publicTacJson.model || publicTacJson.Model || publicTacJson.name || publicTacJson.Name;

          if (brand || model) {
            setImeiResult({
              ...baseResult,
              source: "ImeiCheck TAC publico",
              status: "Pre-check",
              brand,
              model,
              name: [brand, model].filter(Boolean).join(" "),
              notes: [
                "IMEI passou na validação matemática Luhn.",
                `Marca/modelo retornado pela consulta publica: ${[brand, model].filter(Boolean).join(" ") || "nao informado"}.`,
                "Esta consulta identifica aparelho por TAC/modelo. Para blacklist, iCloud e bloqueio, use uma consulta completa.",
              ],
            });
            toast.success("Consulta publica de modelo concluida");
            return;
          }
        }
      } catch {
        // Continua para o provedor com chave ou pre-check local.
      }

      if (!imeiApiKey.trim()) {
        setImeiResult({
          ...baseResult,
          notes: [
            ...baseResult.notes,
            "A consulta publica sem chave pode ser bloqueada por protecao anti-abuso. Ainda assim, o certificado manual pode ser gerado com o pre-check local.",
          ],
        });
        toast.success("Pre-check gerado. Consulta completa requer provedor com chave.");
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("fiado-imei-api-key", imeiApiKey.trim());
      }

      const deviceParams = new URLSearchParams({
        key: imeiApiKey.trim(),
        imei,
        service: "2",
      });
      const blacklistParams = new URLSearchParams({
        key: imeiApiKey.trim(),
        imei,
        service: "3",
      });

      const [deviceResponse, blacklistResponse] = await Promise.all([
        fetch(`https://api.imei.eu/?${deviceParams.toString()}`),
        fetch(`https://api.imei.eu/?${blacklistParams.toString()}`),
      ]);
      const [deviceJson, blacklistJson] = await Promise.all([
        deviceResponse.json(),
        blacklistResponse.json(),
      ]);

      if (deviceJson.status !== "ok") {
        throw new Error(deviceJson.error || "consulta de modelo recusada");
      }
      if (blacklistJson.status !== "ok") {
        throw new Error(blacklistJson.error || "consulta de blacklist recusada");
      }

      const blacklisted = Boolean(blacklistJson.data?.blacklisted);
      const result: ImeiCheckResult = {
        ...baseResult,
        source: "IMEI.EU API",
        status: blacklisted ? "Atenção" : "Aprovado",
        brand: deviceJson.data?.brand,
        model: deviceJson.data?.model,
        name: deviceJson.data?.name,
        blacklisted,
        notes: [
          `Marca/modelo retornado pela API: ${[deviceJson.data?.brand, deviceJson.data?.name, deviceJson.data?.model].filter(Boolean).join(" ") || "não informado"}.`,
          blacklisted
            ? "A API marcou este IMEI como blacklist. Não recomendo compra/venda sem auditoria manual."
            : "A API não retornou blacklist para este IMEI.",
        ],
      };

      setImeiResult(result);
      toast.success(blacklisted ? "Consulta concluida com alerta" : "IMEI aprovado na consulta");
    } catch (error) {
      setImeiResult({
        ...baseResult,
        notes: [
          ...baseResult.notes,
          `A API não respondeu nesta tentativa: ${error instanceof Error ? error.message : "erro desconhecido"}.`,
        ],
      });
      toast.error("Não consegui consultar a API agora. Gere o pre-check e tente novamente.");
    } finally {
      setCheckingImei(false);
    }
  }

  function generateImeiCertificate() {
    if (!imeiResult) {
      toast.error("Consulte um IMEI antes de gerar o certificado");
      return;
    }

    const html = buildImeiCertificateHtml(imeiResult, firstName);
    const certificateWindow = window.open("", "_blank", "width=920,height=720");
    if (!certificateWindow) {
      toast.error("Permita pop-ups para gerar o certificado");
      return;
    }
    certificateWindow.document.write(html);
    certificateWindow.document.close();
    certificateWindow.focus();
    certificateWindow.print();
  }

  function addPart() {
    const quantity = Math.max(0, Number(newPart.quantidade) || 0);
    const part: Part = {
      id: Date.now(),
      tipo: newPart.tipo,
      modelo: newPart.modelo,
      qualidade: "Premium",
      sku: `${newPart.tipo.slice(0, 3).toUpperCase()}-${newPart.modelo.replace(/\s/g, "-").toUpperCase()}`,
      fornecedor: "Fornecedor padrão",
      custo: 0,
      preco: 0,
      precoInstalado: 0,
      quantidade: quantity,
      minimo: 2,
      localizacao: "Sem localização",
      garantia: 90,
      status: quantity <= 0 ? "Sem estoque" : quantity <= 2 ? "Baixo estoque" : "Disponível",
    };
    setParts((items) => [part, ...items]);
    toast.success("Peça cadastrada");
  }

  async function saveStockProduct() {
    if (!user) {
      toast.error("Entre na sua conta para salvar no banco de dados");
      return;
    }

    const quantity = Math.max(0, Number(stockProduct.quantidade) || 0);
    const minQuantity = Math.max(0, Number(stockProduct.quantidadeMinima) || 0);
    const cost = moneyToNumber(stockProduct.valorCusto);
    const salePrice = moneyToNumber(stockProduct.valorVenda);
    const warranty = Math.max(0, Number(stockProduct.diasGarantia) || 0);
    const productName =
      stockProduct.kind === "Aparelho"
        ? (stockProduct.modelo || stockProduct.nome).trim()
        : stockProduct.nome.trim();
    const selectedType =
      stockProduct.tipo.trim() ||
      (stockProduct.kind === "Aparelho"
        ? "Celular"
        : stockProduct.kind === "Acessório"
          ? "Acessório"
          : "Peça");

    if (!selectedType || !productName || salePrice <= 0) {
      toast.error("Preencha tipo, nome do produto e valor de venda");
      return;
    }

    if (stockProduct.kind === "Aparelho") {
      const phone: Phone = {
        id: Date.now(),
        modelo: stockProduct.modelo || productName,
        linha: (stockProduct.modelo || productName).replace("iPhone ", ""),
        capacidade: stockProduct.gb || "128GB",
        cor: stockProduct.cor || "Sem cor",
        estado: stockProduct.categoria || "Seminovo",
        bateria: Math.max(0, Number(stockProduct.tags.match(/\d+/)?.[0]) || 100),
        imei: stockProduct.imei || stockProduct.codigo || `IMEI-${Date.now().toString().slice(-6)}`,
        serial: stockProduct.serial || stockProduct.sku || `SN-${Date.now().toString().slice(-6)}`,
        faceId: "Não sei",
        trueTone: "Não sei",
        telaOriginal: "Não sei",
        bateriaOriginal: "Não sei",
        aberto: "Não sei",
        bloqueio: stockProduct.disponibilidade,
        acompanha: [stockProduct.subcategoria || "Cadastro estoque"].filter(Boolean),
        custoCompra: cost,
        custoManutencao: 0,
        precoVenda: salePrice,
        status: "Disponível" as PhoneStatus,
        observacoes: stockProduct.observacao || "Cadastrado pelo estoque completo.",
      };
      const savedPhone = await saveLojaInventoryProduct({
        userId: user.id,
        kind: "phone",
        name: `${phone.modelo} ${phone.capacidade} ${phone.cor}`.trim(),
        sku: phone.imei || phone.serial,
        salePrice: phone.precoVenda,
        quantity: 1,
        minimum: 0,
        status: phone.status,
        data: phone,
      });
      if (!savedPhone) return;

      setPhones((items) => [savedPhone as Phone, ...items]);
      toast.success("Aparelho cadastrado no estoque");
    } else {
      const part: Part = {
        id: Date.now(),
        tipo: selectedType,
        modelo: stockProduct.modelo,
        qualidade: stockProduct.categoria || stockProduct.subcategoria || "Premium",
        sku:
          stockProduct.sku ||
          `${selectedType.slice(0, 3).toUpperCase()}-${stockProduct.modelo.replace(/\s/g, "-").toUpperCase()}`,
        fornecedor: stockProduct.fornecedor || "Fornecedor não informado",
        custo: cost,
        preco: salePrice,
        precoInstalado: salePrice,
        quantidade: quantity,
        minimo: minQuantity,
        localizacao: stockProduct.codigoBarras || "Sem localização",
        garantia: warranty,
        status: stockStatus(quantity, minQuantity),
      };
      const savedPart = await saveLojaInventoryProduct({
        userId: user.id,
        kind: "part",
        name: `${part.tipo} ${part.modelo}`.trim(),
        sku: part.sku,
        salePrice: part.preco,
        quantity: part.quantidade,
        minimum: part.minimo,
        status: part.status,
        data: part,
      });
      if (!savedPart) return;

      setParts((items) => [savedPart as Part, ...items]);
      toast.success(stockProduct.kind === "Acessório" ? "Acessório cadastrado" : "Peça cadastrada");
    }

    setStockProduct(emptyStockProductForm);
    setStockProductOpen(false);
    resetFilters("estoque");
  }

  function addService() {
    const service: ServiceOrder = {
      id: Date.now(),
      cliente: newService.cliente || "Cliente balcão",
      whatsapp: "",
      modelo: newService.modelo,
      imei: "",
      problema: "Aguardando diagnóstico.",
      diagnostico: "Pendente",
      servico: newService.servico,
      peca: "",
      custoPeca: 0,
      maoObra: 0,
      entrada: 0,
      formaPagamento: "A definir",
      status: "Recebido",
      prazo: today,
      garantia: 90,
      observacoes: "Ordem criada pelo cadastro rápido.",
    };
    setServices((items) => [service, ...items]);
    toast.success("Ordem de serviço criada");
  }

  function createClientFromDraft(draft: {
    nome: string;
    tipo: Client["tipo"];
    whatsapp?: string;
    documento?: string;
    endereco?: string;
    observacoes?: string;
  }): Client {
    return {
      id: Date.now() + Math.floor(Math.random() * 1000),
      nome: draft.nome.trim(),
      tipo: draft.tipo,
      whatsapp: draft.whatsapp?.trim() || "",
      cpf: draft.documento?.trim() || "",
      endereco: draft.endereco?.trim() || "",
      compras: 0,
      totalComprado: 0,
      aberto: 0,
      aparelhos: [],
      servicos: [],
      pecas: [],
      status: "Ativo",
      observacoes: draft.observacoes?.trim() || "",
    };
  }

  function addClient() {
    if (!newClient.nome.trim()) {
      toast.error("Informe o nome do cliente");
      return;
    }

    setClients((items) => [
      createClientFromDraft({
        nome: newClient.nome,
        tipo: newClient.tipo,
        whatsapp: newClient.whatsapp,
        documento: newClient.documento,
        endereco: newClient.endereco,
        observacoes: newClient.observacoes,
      }),
      ...items,
    ]);
    setNewClient({
      nome: "",
      tipo: newClient.tipo,
      whatsapp: "",
      documento: "",
      endereco: "",
      observacoes: "",
    });
    toast.success("Cliente cadastrado");
  }

  function importClientList() {
    const lines = clientListText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) {
      toast.error("Cole uma lista de clientes para importar");
      return;
    }

    const imported = lines.map((line) => {
      const [name = "", whatsapp = "", document = "", note = ""] = line
        .split(/[;,|]/)
        .map((part) => part.trim());
      return createClientFromDraft({
        nome: name || "Cliente sem nome",
        tipo: newClient.tipo,
        whatsapp,
        documento: document,
        observacoes: note,
      });
    });

    setClients((items) => [...imported, ...items]);
    setClientListText("");
    toast.success(`${imported.length} clientes importados`);
  }

  async function runFiadoAI() {
    if (!aiPrompt.trim()) {
      toast.error("Escreva sua duvida ou cole a lista de pecas");
      return;
    }

    setAiLoading(true);
    setAiQuestions([]);
    setAiAnswer("");
    setAiDraftParts([]);

    try {
      const result = await askFiadoAI({
        data: {
          mode: aiMode,
          prompt: aiPrompt,
          appContext: {
            phones: phones.length,
            parts: parts.length,
            clients: clients.length,
            sales: sales.length,
            services: services.length,
          },
        },
      });
      setAiAnswer(result.answer);
      setAiQuestions(result.questions);
      setAiDraftParts(result.parts);
      toast.success("IA processou o pedido");
    } catch {
      const fallbackParts =
        aiMode === "catalogo" ? sanitizeAiParts(parseCatalogText(aiPrompt)) : [];
      setAiAnswer(localFiadoAnswer(aiMode, fallbackParts.length, aiPrompt));
      setAiQuestions(buildAiQuestions(fallbackParts));
      setAiDraftParts(fallbackParts);
      toast.success("IA respondeu com base no manual do Fiado");
    } finally {
      setAiLoading(false);
    }
  }

  function importAiDraftParts() {
    if (!aiDraftParts.length) {
      toast.error("Nenhum item de catalogo para importar");
      return;
    }

    const now = Date.now();
    const imported: Part[] = aiDraftParts.map((part, index) => ({
      id: now + index,
      tipo: part.tipo,
      modelo: part.modelo,
      qualidade: part.qualidade,
      sku: `AI-${String(now).slice(-5)}-${index + 1}`,
      fornecedor: part.fornecedor,
      custo: part.custo,
      preco: part.preco,
      precoInstalado: part.precoInstalado,
      quantidade: part.quantidade,
      minimo: part.minimo,
      localizacao: part.localizacao,
      garantia: part.garantia,
      status: stockStatus(part.quantidade, part.minimo),
    }));

    setParts((items) => [...imported, ...items]);
    setAiDraftParts([]);
    resetFilters("estoque");
    toast.success(`${imported.length} itens adicionados ao estoque`);
  }

  function addSale() {
    const value = Number(newSale.valor) || 0;
    const entry = Number(newSale.entrada) || 0;
    const installments = Math.max(1, Number(newSale.parcelas) || 1);
    const monthlyInterest = Math.max(0, Number(newSale.jurosMensal) || 0);
    const chargeDay = Math.min(31, Math.max(1, Number(newSale.diaCobranca) || 20));
    if (!newSale.item || value <= 0) {
      toast.error("Informe item e valor da venda");
      return;
    }
    if (entry > value) {
      toast.error("A entrada não pode ser maior que o valor da venda");
      return;
    }

    const isLoan = newSale.modalidade === "emprestimo";
    const balance = Math.max(value - entry, 0);
    const programmedTotal = isLoan
      ? Number((balance * (1 + (monthlyInterest / 100) * installments)).toFixed(2))
      : balance;
    const schedule =
      isLoan && balance > 0
        ? buildLoanSchedule({
            firstDueDate: newSale.primeiraParcela || nextDueDate(today, chargeDay),
            chargeDay,
            count: installments,
            total: programmedTotal,
          })
        : undefined;
    const sale: Sale = {
      id: Date.now(),
      cliente: newSale.cliente || "Cliente balcão",
      tipo: newSale.tipo,
      item: newSale.item,
      quantidade: 1,
      unitario: isLoan ? value + (programmedTotal - balance) : value,
      desconto: 0,
      pagamento: isLoan ? "Empréstimo programado" : entry >= value ? "Pix" : "Entrada + parcelas",
      entrada: entry,
      parcelas: installments,
      vencimento: schedule?.[0]?.vencimento ?? newSale.primeiraParcela,
      status: entry >= value ? "Pago" : entry > 0 ? "Parcial" : "Em aberto",
      lucro: Math.max(value * 0.35, 0),
      modalidade: newSale.modalidade,
      jurosMensal: monthlyInterest,
      diaCobranca: chargeDay,
      totalProgramado: programmedTotal,
      parcelasAgenda: schedule,
    };
    setSales((items) => [sale, ...items]);
    if (entry > 0) {
      setPayments((items) => [
        {
          id: Date.now() + 1,
          cliente: sale.cliente,
          venda: sale.item,
          valor: entry,
          forma: sale.pagamento,
          data: today,
          observacoes: "Entrada registrada automaticamente.",
        },
        ...items,
      ]);
    }
    setParts((items) =>
      items.map((part) =>
        sale.item.includes(part.tipo) && sale.item.includes(part.modelo)
          ? {
              ...part,
              quantidade: Math.max(part.quantidade - 1, 0),
              status:
                part.quantidade - 1 <= 0
                  ? "Sem estoque"
                  : part.quantidade - 1 <= part.minimo
                    ? "Baixo estoque"
                    : "Disponível",
            }
          : part,
      ),
    );
    toast.success(
      isLoan
        ? "Venda por empréstimo programada com cobranças"
        : "Venda registrada e estoque atualizado",
    );
  }

  function registerLoan() {
    const value = Number(newLoan.valor) || 0;
    const entry = Number(newLoan.entrada) || 0;
    const installments = Math.max(1, Number(newLoan.parcelas) || 1);
    const monthlyInterest = Math.max(0, Number(newLoan.jurosMensal) || 0);
    const chargeDay = Math.min(31, Math.max(1, Number(newLoan.diaCobranca) || 20));

    if (!newLoan.item || value <= 0) {
      toast.error("Informe a peca ou celular emprestado e o valor");
      return;
    }

    if (entry > value) {
      toast.error("A entrada nao pode ser maior que o valor do emprestimo");
      return;
    }

    const balance = Math.max(value - entry, 0);
    const programmedTotal = Number(
      (balance * (1 + (monthlyInterest / 100) * installments)).toFixed(2),
    );
    const schedule =
      balance > 0
        ? buildLoanSchedule({
            firstDueDate: newLoan.primeiraParcela || nextDueDate(today, chargeDay),
            chargeDay,
            count: installments,
            total: programmedTotal,
          })
        : undefined;
    const linkedPhone = phones.find((phone) => newLoan.item.includes(phone.modelo));
    const loanKind = linkedPhone ? "Celular" : "Peça";
    const sale: Sale = {
      id: Date.now(),
      cliente: newLoan.cliente || "Cliente balcao",
      tipo: loanKind,
      item: newLoan.item,
      quantidade: 1,
      unitario: value + (programmedTotal - balance),
      desconto: 0,
      pagamento: "Emprestimo programado",
      entrada: entry,
      parcelas: installments,
      vencimento: schedule?.[0]?.vencimento ?? newLoan.primeiraParcela,
      status: entry >= value ? "Pago" : entry > 0 ? "Parcial" : "Em aberto",
      lucro: Math.max(value * 0.25, 0),
      modalidade: "emprestimo",
      jurosMensal: monthlyInterest,
      diaCobranca: chargeDay,
      totalProgramado: programmedTotal,
      parcelasAgenda: schedule,
    };

    setSales((items) => [sale, ...items]);
    if (entry > 0) {
      setPayments((items) => [
        {
          id: Date.now() + 1,
          cliente: sale.cliente,
          venda: sale.item,
          valor: entry,
          forma: "Entrada de emprestimo",
          data: today,
          observacoes: "Entrada registrada no emprestimo de peca.",
        },
        ...items,
      ]);
    }
    setParts((items) =>
      items.map((part) =>
        sale.item.includes(part.tipo) && sale.item.includes(part.modelo)
          ? {
              ...part,
              quantidade: Math.max(part.quantidade - 1, 0),
              status:
                part.quantidade - 1 <= 0
                  ? "Sem estoque"
                  : part.quantidade - 1 <= part.minimo
                    ? "Baixo estoque"
                    : "Disponível",
            }
          : part,
      ),
    );
    if (linkedPhone) {
      setPhones((items) =>
        items.map((phone) => (phone.id === linkedPhone.id ? { ...phone, status: "Fiado" } : phone)),
      );
    }
    setNewLoan({
      cliente: "",
      item: "",
      valor: "",
      entrada: "",
      parcelas: "1",
      jurosMensal: "0",
      diaCobranca: "20",
      primeiraParcela: nextDueDate(today, 20),
    });
    toast.success("Emprestimo registrado e cobrancas programadas");
  }

  function validateLoanPayment(saleId: number) {
    const sale = sales.find((item) => item.id === saleId);
    const nextInstallment = sale?.parcelasAgenda?.find(
      (installment) => installment.status !== "pago",
    );

    if (!sale || !nextInstallment) {
      toast.error("Nenhuma parcela pendente para validar");
      return;
    }

    setSales((items) =>
      items.map((item) => {
        if (item.id !== saleId || !item.parcelasAgenda?.length) return item;
        const nextAgenda = item.parcelasAgenda.map((installment) =>
          installment.id === nextInstallment.id
            ? { ...installment, status: "pago" as const }
            : installment,
        );
        const paidValue = nextAgenda
          .filter((installment) => installment.status === "pago")
          .reduce((acc, installment) => acc + installment.valor, item.entrada);
        const allPaid = nextAgenda.every((installment) => installment.status === "pago");
        return {
          ...item,
          parcelasAgenda: nextAgenda,
          entrada: Math.min(paidValue, item.unitario - item.desconto),
          status: allPaid ? "Pago" : "Parcial",
        };
      }),
    );
    setPayments((items) => [
      {
        id: Date.now() + nextInstallment.id,
        cliente: sale.cliente,
        venda: `${sale.item} - parcela ${nextInstallment.numero}/${sale.parcelas}`,
        valor: nextInstallment.valor,
        forma: "Emprestimo",
        data: today,
        observacoes: "Pagamento de emprestimo validado.",
      },
      ...items,
    ]);
    toast.success("Pagamento do emprestimo validado");
  }

  function removeById<T extends { id: number }>(
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    id: number,
  ) {
    setter((items) => items.filter((item) => item.id !== id));
    toast.success("Item excluído");
  }

  async function removeInventoryById<T extends { id: number; productId?: string }>(
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    item: T,
  ) {
    if (item.productId) {
      const { error } = await supabase.from("products").delete().eq("id", item.productId);
      if (error) {
        toast.error("Nao consegui excluir do banco da sua conta");
        return;
      }
    }

    setter((items) => items.filter((current) => current.id !== item.id));
    toast.success("Item excluido");
  }

  function markChargePaid(id: number, installmentId?: number | null) {
    setSales((items) =>
      items.map((item) => {
        if (item.id !== id) return item;

        if (!installmentId || !item.parcelasAgenda?.length) {
          return { ...item, status: "Pago", entrada: item.unitario - item.desconto };
        }

        const nextAgenda = item.parcelasAgenda.map((installment) =>
          installment.id === installmentId
            ? { ...installment, status: "pago" as const }
            : installment,
        );
        const paidValue = nextAgenda
          .filter((installment) => installment.status === "pago")
          .reduce((acc, installment) => acc + installment.valor, item.entrada);
        const allPaid = nextAgenda.every((installment) => installment.status === "pago");
        return {
          ...item,
          parcelasAgenda: nextAgenda,
          entrada: Math.min(paidValue, item.unitario - item.desconto),
          status: allPaid ? "Pago" : "Parcial",
        };
      }),
    );
    toast.success(installmentId ? "Parcela marcada como paga" : "Cobrança marcada como paga");
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background md:flex">
      <aside className="hidden shrink-0 flex-col gap-5 rounded-l-[28px] bg-surface p-5 md:flex md:w-[268px]">
        <div className="px-1 pt-1">
          <AppLogo />
        </div>

        <div className="px-1">
          <h2 className="text-[26px] leading-[1.1] font-semibold tracking-tight text-foreground">
            Bem-vindo
            <br />
            de volta
            <br />
            <span className="text-primary capitalize">{firstName}</span>
          </h2>
          <p className="mt-3 text-[11px] text-muted-foreground">Última atualização: hoje</p>
        </div>

        <nav className="flex flex-col gap-0.5 rounded-2xl bg-surface-muted p-2">
          {tabs.map((item) => {
            const Icon = item.icon;
            const selected = active === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => resetFilters(item.id)}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition ${
                  selected
                    ? "bg-surface text-primary shadow-soft"
                    : "text-foreground/70 hover:bg-surface/60 hover:text-foreground"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
                <span className="flex-1">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl bg-ink p-4 text-ink-foreground shadow-ink">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-white/10">
              <BellRing className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div className="flex-1">
              <p className="text-[10.5px] text-white/60">Cobranças do mês</p>
              <p className="mt-0.5 text-[22px] leading-none font-semibold">{charges.length}</p>
            </div>
          </div>
          <p className="mt-3 text-[10.5px] text-white/60">clientes com pendência</p>
          <button
            type="button"
            onClick={() => resetFilters("cobrancas")}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-[12px] font-medium text-ink transition hover:opacity-95"
          >
            Ver cobranças <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col gap-3 bg-surface p-3 sm:gap-4 sm:p-4 md:p-5">
        <header className="flex min-w-0 flex-col gap-3 px-1 pt-1 sm:px-2 lg:flex-row lg:items-center lg:justify-between">
          <nav className="no-scrollbar -mx-1 flex min-w-0 items-center gap-1 overflow-x-auto rounded-full bg-surface-muted p-1.5 md:mx-0">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => resetFilters(item.id)}
                className={`shrink-0 rounded-full px-3 py-2 text-[12px] font-medium transition sm:px-4 sm:text-[12.5px] ${
                  active === item.id
                    ? "bg-surface text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex min-w-0 items-center justify-end gap-2.5 lg:ml-auto">
            <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface text-foreground/70 shadow-soft">
              <BellRing className="h-[18px] w-[18px]" strokeWidth={1.7} />
            </button>
            <div className="flex min-w-0 items-center gap-3 rounded-full bg-surface py-1.5 pr-2 pl-1.5 shadow-soft">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-ink text-xs font-semibold text-primary-foreground uppercase">
                {initials}
              </div>
              <div className="hidden min-w-0 leading-tight pr-2 sm:block">
                <p className="text-[12.5px] font-medium text-foreground capitalize">{firstName}</p>
                <p className="max-w-[160px] truncate text-[10px] text-muted-foreground">{email}</p>
              </div>
              <button
                title="Sair"
                onClick={async () => {
                  await signOut();
                  toast.success("Sessão encerrada");
                }}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-muted text-muted-foreground transition hover:text-destructive"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </header>

        <div className="min-w-0 flex-1 rounded-[22px] bg-surface-muted p-4 sm:p-5 md:rounded-[24px] md:p-7">
          <div key={active} className="iphone-step-transition section-slide min-w-0">
            <PageHeader active={active} onPrimary={startPrimaryFlow} />

            {active === "dashboard" && (
              <DashboardView
                totals={totals}
                phones={phones}
                parts={parts}
                services={services}
                clients={clients}
                sales={sales}
              />
            )}

            {active !== "dashboard" &&
              active !== "configuracoes" &&
              active !== "relatorios" &&
              active !== "ia" && (
                <Filters
                  query={query}
                  status={statusFilter}
                  category={categoryFilter}
                  onQuery={setQuery}
                  onStatus={setStatusFilter}
                  onCategory={setCategoryFilter}
                  categories={
                    active === "pecas"
                      ? partTypes.slice(0, 18)
                      : active === "vendas"
                        ? ["Celular", "Peça", "Serviço", "Combo"]
                        : active === "clientes"
                          ? ["B2C", "B2B"]
                          : active === "emprestimos"
                            ? ["Peça"]
                            : []
                  }
                />
              )}

            {stockProductOpen && (
              <StockProductFormCard
                id="iphone-stock-product-form"
                form={stockProduct}
                onChange={(patch) => setStockProduct((current) => ({ ...current, ...patch }))}
                onSave={saveStockProduct}
                onReset={() => setStockProduct(emptyStockProductForm)}
                onClose={() => setStockProductOpen(false)}
              />
            )}

            {active === "celulares" && (
              <>
                <ImeiLookupCard
                  imei={imeiQuery}
                  apiKey={imeiApiKey}
                  checking={checkingImei}
                  result={imeiResult}
                  onImeiChange={setImeiQuery}
                  onApiKeyChange={(value) => {
                    setImeiApiKey(value);
                    if (typeof window !== "undefined") {
                      localStorage.setItem("fiado-imei-api-key", value);
                    }
                  }}
                  onLookup={lookupImei}
                  onCertificate={generateImeiCertificate}
                />
              </>
            )}

            {active === "celulares" && (
              <DataCard>
                <ResponsiveTable
                  columns={[
                    "Modelo",
                    "IMEI",
                    "Bateria",
                    "Originais",
                    "Custos",
                    "Venda",
                    "Status",
                    "Ações",
                  ]}
                  rows={filteredPhones.map((phone) => [
                    <ItemTitle
                      key="modelo"
                      title={`${phone.modelo} ${phone.capacidade} ${phone.cor}`}
                      subtitle={`${phone.estado} • ${phone.bloqueio}`}
                    />,
                    phone.imei,
                    `${phone.bateria}%`,
                    `Face ID ${phone.faceId} • Tela ${phone.telaOriginal}`,
                    `${brl(phone.custoCompra + phone.custoManutencao)}`,
                    brl(phone.precoVenda),
                    <StatusPill key="status" status={phone.status} />,
                    <Actions
                      key="actions"
                      onDelete={() => void removeInventoryById(setPhones, phone)}
                    />,
                  ])}
                />
              </DataCard>
            )}

            {active === "pecas" && (
              <>
                <DataCard>
                  <ResponsiveTable
                    columns={[
                      "Peça",
                      "Qualidade",
                      "Fornecedor",
                      "Preço",
                      "Estoque",
                      "Garantia",
                      "Status",
                      "Ações",
                    ]}
                    rows={filteredParts.map((part) => [
                      <ItemTitle
                        key="peca"
                        title={`${part.tipo} ${part.modelo}`}
                        subtitle={`${part.sku} • ${part.localizacao}`}
                      />,
                      part.qualidade,
                      part.fornecedor,
                      `${brl(part.preco)} / instalado ${brl(part.precoInstalado)}`,
                      `${part.quantidade} un. • mínimo ${part.minimo}`,
                      `${part.garantia} dias`,
                      <StockPill key="status" part={part} />,
                      <Actions
                        key="actions"
                        onDelete={() => void removeInventoryById(setParts, part)}
                      />,
                    ])}
                  />
                </DataCard>
              </>
            )}

            {active === "servicos" && (
              <>
                <ModuleCard
                  id="iphone-service-form"
                  title="Nova ordem de serviço"
                  icon={Wrench}
                  action={<Button onClick={addService}>Criar OS</Button>}
                >
                  <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr]">
                    <Input
                      placeholder="Cliente"
                      value={newService.cliente}
                      onChange={(event) =>
                        setNewService({ ...newService, cliente: event.target.value })
                      }
                    />
                    <SelectLike
                      value={newService.modelo}
                      onChange={(value) => setNewService({ ...newService, modelo: value })}
                      options={iphoneModels}
                    />
                    <SelectLike
                      value={newService.servico}
                      onChange={(value) => setNewService({ ...newService, servico: value })}
                      options={serviceTypes}
                    />
                  </div>
                </ModuleCard>
                <DataCard>
                  <ResponsiveTable
                    columns={[
                      "Cliente",
                      "Aparelho",
                      "Problema",
                      "Serviço",
                      "Valores",
                      "Prazo",
                      "Status",
                      "Ações",
                    ]}
                    rows={filteredServices.map((service) => {
                      const total = service.custoPeca + service.maoObra;
                      return [
                        <ItemTitle
                          key="cliente"
                          title={service.cliente}
                          subtitle={service.whatsapp || "WhatsApp não informado"}
                        />,
                        <ItemTitle
                          key="modelo"
                          title={service.modelo}
                          subtitle={service.imei || "Sem IMEI"}
                        />,
                        service.problema,
                        <ItemTitle
                          key="servico"
                          title={service.servico}
                          subtitle={`Peça: ${service.peca || "A definir"}`}
                        />,
                        `${brl(total)} • entrada ${brl(service.entrada)}`,
                        service.prazo,
                        <StatusPill key="status" status={service.status} />,
                        <Actions
                          key="actions"
                          onDelete={() => removeById(setServices, service.id)}
                        />,
                      ];
                    })}
                  />
                </DataCard>
              </>
            )}

            {active === "clientes" && (
              <>
                <ModuleCard
                  id="iphone-client-form"
                  title="Cadastrar clientes"
                  icon={Users}
                  action={<Button onClick={addClient}>Cadastrar cliente</Button>}
                >
                  <div className="mb-4 flex flex-wrap gap-2 rounded-[22px] bg-surface-muted p-1">
                    {[
                      { id: "B2C", label: "B2C venda final" },
                      { id: "B2B", label: "B2B revenda" },
                    ].map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() =>
                          setNewClient({ ...newClient, tipo: option.id as Client["tipo"] })
                        }
                        className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                          newClient.tipo === option.id
                            ? "bg-primary text-primary-foreground shadow-soft"
                            : "bg-surface text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid gap-3 lg:grid-cols-[1.2fr_150px_1fr_1fr]">
                    <Input
                      placeholder="Nome ou empresa"
                      value={newClient.nome}
                      onChange={(event) => setNewClient({ ...newClient, nome: event.target.value })}
                    />
                    <Input
                      placeholder="WhatsApp"
                      value={newClient.whatsapp}
                      onChange={(event) =>
                        setNewClient({ ...newClient, whatsapp: event.target.value })
                      }
                    />
                    <Input
                      placeholder="CPF/CNPJ opcional"
                      value={newClient.documento}
                      onChange={(event) =>
                        setNewClient({ ...newClient, documento: event.target.value })
                      }
                    />
                    <Input
                      placeholder="Endereco opcional"
                      value={newClient.endereco}
                      onChange={(event) =>
                        setNewClient({ ...newClient, endereco: event.target.value })
                      }
                    />
                  </div>
                  <Textarea
                    className="mt-3 min-h-20 rounded-[22px]"
                    placeholder="Observacoes, perfil de compra, limite, modelos de interesse..."
                    value={newClient.observacoes}
                    onChange={(event) =>
                      setNewClient({ ...newClient, observacoes: event.target.value })
                    }
                  />
                  <div className="mt-4 rounded-[22px] border border-border bg-surface-muted p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Importar lista de clientes
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Cole um por linha. Formato: nome; whatsapp; cpf/cnpj; observacao.
                        </p>
                      </div>
                      <Button type="button" variant="outline" onClick={importClientList}>
                        Importar lista
                      </Button>
                    </div>
                    <Textarea
                      className="mt-3 min-h-24 rounded-[18px] bg-surface"
                      placeholder={`Joao Silva; 11999999999; 000.000.000-00; cliente final\nLoja Alfa; 11988888888; 00.000.000/0001-00; revenda`}
                      value={clientListText}
                      onChange={(event) => setClientListText(event.target.value)}
                    />
                  </div>
                </ModuleCard>

                <DataCard>
                  <ResponsiveTable
                    columns={[
                      "Cliente",
                      "Tipo",
                      "Histórico",
                      "Compras",
                      "Total comprado",
                      "Em aberto",
                      "Status",
                      "Ações",
                    ]}
                    rows={filteredClients.map((client) => [
                      <ItemTitle
                        key="cliente"
                        title={client.nome}
                        subtitle={`${client.whatsapp} • ${client.endereco || "Sem endereço"}`}
                      />,
                      <StatusPill key="tipo" status={client.tipo} />,
                      `${client.aparelhos.join(", ") || "Sem aparelhos"} • ${client.servicos.join(", ") || "Sem serviços"}`,
                      String(client.compras),
                      brl(client.totalComprado),
                      brl(client.aberto),
                      <StatusPill key="status" status={client.status} />,
                      <Actions key="actions" onDelete={() => removeById(setClients, client.id)} />,
                    ])}
                  />
                </DataCard>
              </>
            )}

            {active === "vendas" && (
              <>
                <ModuleCard
                  id="iphone-sale-form"
                  title="Nova venda"
                  icon={BadgeDollarSign}
                  action={<Button onClick={addSale}>Registrar venda</Button>}
                >
                  <div className="mb-4 flex flex-wrap gap-2 rounded-[22px] bg-surface-muted p-1">
                    {[
                      { id: "avista", label: "A vista" },
                      { id: "fiado", label: "Fiado" },
                      { id: "emprestimo", label: "Emprestimo" },
                    ].map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() =>
                          setNewSale({
                            ...newSale,
                            modalidade: option.id as NonNullable<Sale["modalidade"]>,
                            parcelas: option.id === "avista" ? "1" : newSale.parcelas,
                          })
                        }
                        className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                          newSale.modalidade === option.id
                            ? "bg-primary text-primary-foreground shadow-soft"
                            : "bg-surface text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid gap-3 lg:grid-cols-[1fr_150px_1fr_130px_130px_110px]">
                    <Input
                      placeholder="Cliente"
                      value={newSale.cliente}
                      onChange={(event) => setNewSale({ ...newSale, cliente: event.target.value })}
                    />
                    <SelectLike
                      value={newSale.tipo}
                      onChange={(value) => setNewSale({ ...newSale, tipo: value as Sale["tipo"] })}
                      options={["Celular", "Peça", "Serviço", "Combo"]}
                    />
                    <Input
                      placeholder="Produto/peça/serviço"
                      value={newSale.item}
                      onChange={(event) => setNewSale({ ...newSale, item: event.target.value })}
                    />
                    <Input
                      placeholder="Valor"
                      value={newSale.valor}
                      onChange={(event) => setNewSale({ ...newSale, valor: event.target.value })}
                    />
                    <Input
                      placeholder="Entrada"
                      value={newSale.entrada}
                      onChange={(event) => setNewSale({ ...newSale, entrada: event.target.value })}
                    />
                    <Input
                      placeholder="Parcelas"
                      value={newSale.parcelas}
                      onChange={(event) => setNewSale({ ...newSale, parcelas: event.target.value })}
                    />
                  </div>
                  {newSale.modalidade === "emprestimo" && (
                    <div className="mt-4 grid gap-3 rounded-[22px] border border-primary/15 bg-primary/5 p-4">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">
                            Empréstimo programado
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            O sistema gera as cobranças mensais e acompanha cada parcela.
                          </p>
                        </div>
                        <div className="rounded-full bg-surface px-3 py-2 text-xs font-semibold text-primary shadow-soft">
                          Total programado: {brl(loanProgrammedTotalPreview)}
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <Input
                          placeholder="Juros mensal %"
                          value={newSale.jurosMensal}
                          inputMode="decimal"
                          onChange={(event) =>
                            setNewSale({ ...newSale, jurosMensal: event.target.value })
                          }
                        />
                        <Input
                          placeholder="Dia da cobrança"
                          value={newSale.diaCobranca}
                          inputMode="numeric"
                          onChange={(event) =>
                            setNewSale({ ...newSale, diaCobranca: event.target.value })
                          }
                        />
                        <Input
                          type="date"
                          value={newSale.primeiraParcela}
                          onChange={(event) =>
                            setNewSale({ ...newSale, primeiraParcela: event.target.value })
                          }
                        />
                      </div>
                      {loanSchedulePreview.length > 0 && (
                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                          {loanSchedulePreview.slice(0, 8).map((installment) => (
                            <div
                              key={installment.id}
                              className="rounded-2xl bg-surface px-3 py-2 text-xs shadow-soft"
                            >
                              <p className="font-semibold text-foreground">
                                Parcela {installment.numero}/{loanInstallmentsPreview}
                              </p>
                              <p className="mt-1 text-muted-foreground">
                                {installment.vencimento} • {brl(installment.valor)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </ModuleCard>
                {sales.some((sale) => sale.parcelasAgenda?.length) && (
                  <DataCard title="Empréstimos programados">
                    <ResponsiveTable
                      columns={[
                        "Cliente",
                        "Contrato",
                        "Parcelas",
                        "Total programado",
                        "Próxima cobrança",
                        "Status",
                      ]}
                      rows={sales
                        .filter((sale) => sale.parcelasAgenda?.length)
                        .map((sale) => {
                          const nextInstallment = sale.parcelasAgenda?.find(
                            (installment) => installment.status !== "pago",
                          );
                          return [
                            sale.cliente,
                            sale.item,
                            `${sale.parcelasAgenda?.filter((installment) => installment.status === "pago").length ?? 0}/${sale.parcelas}`,
                            brl(sale.totalProgramado ?? 0),
                            nextInstallment
                              ? `${nextInstallment.vencimento} • ${brl(nextInstallment.valor)}`
                              : "Quitado",
                            <StatusPill key="status" status={sale.status} />,
                          ];
                        })}
                    />
                  </DataCard>
                )}
                <DataCard>
                  <ResponsiveTable
                    columns={[
                      "Cliente",
                      "Venda",
                      "Pagamento",
                      "Total",
                      "Entrada",
                      "Lucro",
                      "Status",
                      "Ações",
                    ]}
                    rows={filteredSales.map((sale) => [
                      sale.cliente,
                      <ItemTitle
                        key="item"
                        title={sale.item}
                        subtitle={`${sale.tipo} • ${sale.quantidade} un.`}
                      />,
                      `${sale.pagamento} • ${sale.parcelas}x`,
                      brl(sale.unitario * sale.quantidade - sale.desconto),
                      brl(sale.entrada),
                      brl(sale.lucro),
                      <StatusPill key="status" status={sale.status} />,
                      <Actions key="actions" onDelete={() => removeById(setSales, sale.id)} />,
                    ])}
                  />
                </DataCard>
              </>
            )}

            {active === "emprestimos" && (
              <>
                <ModuleCard
                  id="iphone-loan-form"
                  title="Registrar emprestimo de peca"
                  icon={Wallet}
                  action={<Button onClick={registerLoan}>Registrar emprestimo</Button>}
                >
                  <div className="grid gap-3 lg:grid-cols-[1fr_1.4fr_130px_130px_110px_120px_150px]">
                    <div className="space-y-1.5">
                      <Label>Cliente</Label>
                      <Input
                        placeholder="Nome do cliente"
                        value={newLoan.cliente}
                        onChange={(event) =>
                          setNewLoan({ ...newLoan, cliente: event.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Peca ou celular emprestado</Label>
                      {loanItemOptions.length > 0 ? (
                        <SelectLike
                          value={newLoan.item}
                          onChange={(value) => setNewLoan({ ...newLoan, item: value })}
                          placeholder="Selecionar do estoque"
                          options={loanItemOptions}
                        />
                      ) : (
                        <Input
                          placeholder="Ex: Bateria iPhone 11 ou iPhone 13 128GB"
                          value={newLoan.item}
                          onChange={(event) => setNewLoan({ ...newLoan, item: event.target.value })}
                        />
                      )}
                      <Input
                        placeholder="Ou digite manualmente o item"
                        value={newLoan.item}
                        onChange={(event) => setNewLoan({ ...newLoan, item: event.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Valor</Label>
                      <Input
                        placeholder="0,00"
                        value={newLoan.valor}
                        inputMode="decimal"
                        onChange={(event) => setNewLoan({ ...newLoan, valor: event.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Entrada</Label>
                      <Input
                        placeholder="0,00"
                        value={newLoan.entrada}
                        inputMode="decimal"
                        onChange={(event) =>
                          setNewLoan({ ...newLoan, entrada: event.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Parcelas</Label>
                      <Input
                        placeholder="1"
                        value={newLoan.parcelas}
                        inputMode="numeric"
                        onChange={(event) =>
                          setNewLoan({ ...newLoan, parcelas: event.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Dia cobranca</Label>
                      <Input
                        placeholder="20"
                        value={newLoan.diaCobranca}
                        inputMode="numeric"
                        onChange={(event) =>
                          setNewLoan({ ...newLoan, diaCobranca: event.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Primeira parcela</Label>
                      <Input
                        type="date"
                        value={newLoan.primeiraParcela}
                        onChange={(event) =>
                          setNewLoan({ ...newLoan, primeiraParcela: event.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 rounded-[22px] border border-primary/15 bg-primary/5 p-4 md:grid-cols-[1fr_160px]">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Agenda de cobranca</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Ao registrar, a peca baixa do estoque e as parcelas entram em Cobrancas.
                      </p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        {loanFormSchedulePreview.slice(0, 4).map((installment) => (
                          <div
                            key={installment.id}
                            className="rounded-2xl bg-surface px-3 py-2 text-xs shadow-soft"
                          >
                            <p className="font-semibold text-foreground">
                              Parcela {installment.numero}/{loanFormInstallmentsPreview}
                            </p>
                            <p className="mt-1 text-muted-foreground">
                              {installment.vencimento} - {brl(installment.valor)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-[18px] bg-surface p-4 shadow-soft">
                      <p className="text-xs text-muted-foreground">Total programado</p>
                      <p className="mt-1 text-2xl font-semibold text-foreground">
                        {brl(loanFormProgrammedTotalPreview)}
                      </p>
                      <Input
                        className="mt-3"
                        placeholder="Juros mensal %"
                        value={newLoan.jurosMensal}
                        inputMode="decimal"
                        onChange={(event) =>
                          setNewLoan({ ...newLoan, jurosMensal: event.target.value })
                        }
                      />
                    </div>
                  </div>
                </ModuleCard>

                <DataCard title="Emprestimos ativos">
                  <ResponsiveTable
                    columns={[
                      "Cliente",
                      "Peca",
                      "Parcelas",
                      "Total programado",
                      "Proxima cobranca",
                      "Status",
                      "Acoes",
                    ]}
                    rows={filteredLoans.map((sale) => {
                      const nextInstallment = sale.parcelasAgenda?.find(
                        (installment) => installment.status !== "pago",
                      );
                      return [
                        sale.cliente,
                        sale.item,
                        `${sale.parcelasAgenda?.filter((installment) => installment.status === "pago").length ?? 0}/${sale.parcelas}`,
                        brl(sale.totalProgramado ?? 0),
                        nextInstallment
                          ? `${nextInstallment.vencimento} - ${brl(nextInstallment.valor)}`
                          : "Quitado",
                        <StatusPill key="status" status={sale.status} />,
                        <div key="actions" className="flex flex-wrap justify-end gap-2">
                          <ActionButton
                            icon={CheckCircle2}
                            label="Validar pagamento"
                            onClick={() => validateLoanPayment(sale.id)}
                          />
                          <ActionButton
                            icon={Trash2}
                            label="Excluir"
                            danger
                            onClick={() => removeById(setSales, sale.id)}
                          />
                        </div>,
                      ];
                    })}
                  />
                </DataCard>
              </>
            )}

            {active === "pagamentos" && (
              <DataCard>
                <ResponsiveTable
                  columns={[
                    "Cliente",
                    "Venda vinculada",
                    "Valor pago",
                    "Forma",
                    "Data",
                    "Observações",
                    "Ações",
                  ]}
                  rows={filteredPayments.map((payment) => [
                    payment.cliente,
                    payment.venda,
                    brl(payment.valor),
                    payment.forma,
                    payment.data,
                    payment.observacoes,
                    <Actions key="actions" onDelete={() => removeById(setPayments, payment.id)} />,
                  ])}
                />
              </DataCard>
            )}

            {active === "cobrancas" && (
              <>
                <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MiniMetric
                    title="Cobranças de hoje"
                    value={String(charges.filter((item) => item.vencimento === today).length)}
                    icon={BellRing}
                  />
                  <MiniMetric
                    title="Vencidas"
                    value={String(charges.filter((item) => item.atraso).length)}
                    icon={Gauge}
                    tone="warning"
                  />
                  <MiniMetric
                    title="Clientes que devem"
                    value={String(new Set(charges.map((item) => item.cliente)).size)}
                    icon={Users}
                  />
                  <MiniMetric
                    title="Valor total em aberto"
                    value={brl(charges.reduce((acc, item) => acc + item.aberto, 0))}
                    icon={CircleDollarSign}
                  />
                </div>
                <div className="mb-4 flex gap-2">
                  {["Todas", "Hoje"].map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setCategoryFilter(label)}
                      className={`rounded-full px-4 py-2 text-xs font-semibold shadow-soft ${
                        categoryFilter === label
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface text-muted-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <DataCard>
                  <ResponsiveTable
                    columns={["Cliente", "Referência", "Vencimento", "Valor", "Status", "Ações"]}
                    rows={filteredCharges.map((charge) => [
                      charge.cliente,
                      charge.item,
                      charge.vencimento,
                      brl(charge.aberto),
                      <StatusPill
                        key="status"
                        status={charge.atraso ? "Atrasado" : charge.status}
                      />,
                      <div key="actions" className="flex flex-wrap justify-end gap-2">
                        <ActionButton
                          icon={BellRing}
                          label="WhatsApp"
                          onClick={() => {
                            const message = `Ola, ${charge.cliente}. Tudo bem? Passando para lembrar que ficou um valor em aberto de ${brl(charge.aberto)} referente a sua compra/servico na loja. O vencimento e ${charge.vencimento}. Pode me confirmar quando consegue realizar o pagamento?`;
                            window.open(
                              `https://wa.me/?text=${encodeURIComponent(message)}`,
                              "_blank",
                            );
                          }}
                        />
                        <ActionButton
                          icon={CheckCircle2}
                          label="Pagar"
                          onClick={() => markChargePaid(charge.id, charge.installmentId)}
                        />
                        <ActionButton
                          icon={PenLine}
                          label="Renegociar"
                          onClick={() => toast.success("Renegociação anotada")}
                        />
                      </div>,
                    ])}
                  />
                </DataCard>
              </>
            )}

            {active === "estoque" && (
              <StockView phones={phones} parts={parts} totals={totals} loading={inventoryLoading} />
            )}
            {active === "relatorios" && (
              <ReportsView
                sales={sales}
                parts={parts}
                clients={clients}
                services={services}
                totals={totals}
              />
            )}
            {active === "ia" && (
              <>
                <ModuleCard
                  id="iphone-ai-assistant"
                  title="IA Fiado"
                  icon={Sparkles}
                  action={
                    <Button onClick={runFiadoAI} disabled={aiLoading}>
                      {aiLoading ? "Processando..." : "Executar IA"}
                    </Button>
                  }
                >
                  <div className="mb-4 flex flex-wrap gap-2 rounded-[22px] bg-surface-muted p-1">
                    {[
                      { id: "catalogo", label: "Preencher catalogo" },
                      { id: "duvida", label: "Tirar duvida" },
                    ].map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setAiMode(option.id as typeof aiMode)}
                        className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                          aiMode === option.id
                            ? "bg-primary text-primary-foreground shadow-soft"
                            : "bg-surface text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <Textarea
                    className="min-h-40 rounded-[22px]"
                    placeholder={
                      aiMode === "catalogo"
                        ? "Cole sua lista: 10 bateria iPhone 11 premium custo 55 venda 120 fornecedor Pedro..."
                        : "Pergunte algo sobre estoque, cobranca, lucro, fiado, cadastro ou assistencia..."
                    }
                    value={aiPrompt}
                    onChange={(event) => setAiPrompt(event.target.value)}
                  />
                </ModuleCard>

                {(aiAnswer || aiQuestions.length > 0) && (
                  <DataCard title="Resposta da IA">
                    <div className="space-y-3 text-sm">
                      {aiAnswer && <p className="text-foreground">{aiAnswer}</p>}
                      {aiQuestions.length > 0 && (
                        <div className="rounded-[20px] border border-warning/25 bg-warning/10 p-4">
                          <p className="font-semibold text-foreground">
                            A IA ficou em duvida sobre:
                          </p>
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                            {aiQuestions.map((question) => (
                              <li key={question}>{question}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </DataCard>
                )}

                {aiDraftParts.length > 0 && (
                  <DataCard title="Catalogo pronto para revisar">
                    <div className="mb-4 flex justify-end">
                      <Button onClick={importAiDraftParts}>Adicionar ao estoque</Button>
                    </div>
                    <ResponsiveTable
                      columns={[
                        "Peca",
                        "Qualidade",
                        "Fornecedor",
                        "Custo",
                        "Venda",
                        "Qtd.",
                        "Revisao",
                      ]}
                      rows={aiDraftParts.map((part) => [
                        <ItemTitle
                          key="item"
                          title={`${part.tipo} ${part.modelo}`}
                          subtitle={part.localizacao || "Sem localizacao"}
                        />,
                        part.qualidade,
                        part.fornecedor || "A definir",
                        brl(part.custo),
                        brl(part.preco),
                        String(part.quantidade),
                        <StatusPill
                          key="review"
                          status={part.precisaRevisao ? "Parcial" : "Ativo"}
                        />,
                      ])}
                    />
                  </DataCard>
                )}
              </>
            )}
            {active === "configuracoes" && <SettingsView />}
          </div>
        </div>
      </main>
    </div>
  );
}

function DashboardView({
  totals,
  phones,
  parts,
  services,
  clients,
  sales,
}: {
  totals: ReturnType<typeof computeTotalsShape>;
  phones: Phone[];
  parts: Part[];
  services: ServiceOrder[];
  clients: Client[];
  sales: Sale[];
}) {
  const categoryTotals = ["Celular", "Peça", "Serviço"].map((category) => ({
    label: category,
    value: sales
      .filter((sale) => sale.tipo === category)
      .reduce((acc, sale) => acc + sale.unitario - sale.desconto, 0),
  }));
  const maxCategory = Math.max(...categoryTotals.map((item) => item.value), 1);
  const months = [
    { label: "Jan", recebido: 0, fiado: 0 },
    { label: "Fev", recebido: 0, fiado: 0 },
    { label: "Mar", recebido: 0, fiado: 0 },
    { label: "Abr", recebido: 0, fiado: 0 },
    { label: "Mai", recebido: totals.totalRecebido, fiado: totals.totalFiado },
  ];
  const chartMax = Math.max(...months.map((item) => Math.max(item.recebido, item.fiado)), 1);

  return (
    <div className="motion-list flex min-w-0 flex-col gap-4 sm:gap-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total vendido no mês"
          value={brl(totals.totalVendido)}
          subtitle="Celulares, peças e serviços"
          icon={BadgeDollarSign}
        />
        <MetricCard
          title="Total recebido no mês"
          value={brl(totals.totalRecebido)}
          subtitle="Pagamentos confirmados"
          icon={Wallet}
        />
        <MetricCard
          title="Total fiado"
          value={brl(totals.totalFiado)}
          subtitle={`${totals.openClients} clientes em aberto`}
          icon={BellRing}
          dark
        />
        <MetricCard
          title="Lucro estimado do mês"
          value={brl(totals.lucro)}
          subtitle="Margem prevista"
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniMetric
          title="Peças com estoque baixo"
          value={String(totals.lowStock.length)}
          icon={Package}
          tone="warning"
        />
        <MiniMetric
          title="Serviços em andamento"
          value={String(totals.activeServices.length)}
          icon={Wrench}
        />
        <MiniMetric
          title="Aparelhos disponíveis"
          value={String(totals.availablePhones)}
          icon={Smartphone}
        />
        <MiniMetric title="Clientes em aberto" value={String(totals.openClients)} icon={Users} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <DataCard title="Receita x Fiado dos últimos 5 meses">
          <div className="grid min-h-[250px] grid-cols-5 items-end gap-5 px-2 pt-6">
            {months.map((month) => (
              <div key={month.label} className="flex h-full flex-col justify-end gap-3">
                <div className="flex flex-1 items-end justify-center gap-2">
                  <span
                    className="w-3 rounded-full bg-primary"
                    style={{
                      height: `${month.recebido > 0 ? Math.max(12, (month.recebido / chartMax) * 170) : 4}px`,
                    }}
                  />
                  <span
                    className="w-3 rounded-full bg-border"
                    style={{
                      height: `${month.fiado > 0 ? Math.max(12, (month.fiado / chartMax) * 170) : 4}px`,
                    }}
                  />
                </div>
                <span className="text-center text-[11px] font-medium text-muted-foreground">
                  {month.label}
                </span>
              </div>
            ))}
          </div>
        </DataCard>

        <DataCard title="Vendas por categoria">
          <div className="space-y-4">
            {categoryTotals.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className="text-muted-foreground">{brl(item.value)}</span>
                </div>
                <div className="h-2 rounded-full bg-surface-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{
                      width: `${item.value > 0 ? Math.max(8, (item.value / maxCategory) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </DataCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <DataCard title="Peças mais vendidas">
          <RankList items={[]} />
        </DataCard>
        <DataCard title="Modelos de iPhone mais vendidos">
          <RankList items={[]} />
        </DataCard>
        <DataCard title="Cobranças pendentes por cliente">
          <RankList
            items={clients
              .filter((client) => client.aberto > 0)
              .map((client) => `${client.nome} - ${brl(client.aberto)}`)}
          />
        </DataCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <DataCard title="Aparelhos em destaque">
          <ResponsiveTable
            columns={["Modelo", "Bateria", "Venda", "Status"]}
            rows={phones
              .slice(0, 4)
              .map((phone) => [
                `${phone.modelo} ${phone.capacidade}`,
                `${phone.bateria}%`,
                brl(phone.precoVenda),
                <StatusPill key="status" status={phone.status} />,
              ])}
          />
        </DataCard>
        <DataCard title="Serviços ativos">
          <ResponsiveTable
            columns={["Cliente", "Modelo", "Serviço", "Status"]}
            rows={services
              .slice(0, 4)
              .map((service) => [
                service.cliente,
                service.modelo,
                service.servico,
                <StatusPill key="status" status={service.status} />,
              ])}
          />
        </DataCard>
      </div>
    </div>
  );
}

function StockView({
  phones,
  parts,
  totals,
  loading,
}: {
  phones: Phone[];
  parts: Part[];
  totals: ReturnType<typeof computeTotalsShape>;
  loading: boolean;
}) {
  const accessoryStock = parts.filter((item) =>
    ["Película", "Capinha", "Cabo", "Carregador"].includes(item.tipo),
  );
  const rows = [
    ...phones
      .filter((phone) => phone.status !== "Vendido")
      .map((phone) => [
        "Celular",
        `${phone.modelo} ${phone.capacidade} ${phone.cor}`.trim(),
        "1 un.",
        phone.imei ? `IMEI ${phone.imei}` : phone.serial || "Sem IMEI",
        <StatusPill key={`phone-${phone.id}`} status={phone.status} />,
      ]),
    ...parts.map((part) => [
      part.tipo,
      `${part.tipo} ${part.modelo}`,
      `${part.quantidade} un.`,
      part.localizacao,
      <StockPill key={`part-${part.id}`} part={part} />,
    ]),
  ];
  return (
    <div className="motion-list flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Estoque de celulares"
          value={String(phones.filter((item) => item.status !== "Vendido").length)}
          subtitle="Aparelhos em loja"
          icon={Smartphone}
        />
        <MetricCard
          title="Estoque de peças"
          value={String(parts.reduce((acc, item) => acc + item.quantidade, 0))}
          subtitle="Unidades disponíveis"
          icon={Package}
        />
        <MetricCard
          title="Acessórios"
          value={String(accessoryStock.reduce((acc, item) => acc + item.quantidade, 0))}
          subtitle="Capinhas, cabos e películas"
          icon={Boxes}
        />
        <MetricCard
          title="Custo parado"
          value={brl(totals.estoqueParado)}
          subtitle={`Lucro potencial ${brl(totals.lucroPotencial)}`}
          icon={CircleDollarSign}
          dark
        />
      </div>
      <DataCard title="Movimentação e alertas">
        <ResponsiveTable
          columns={["Tipo", "Item", "Estoque", "Local", "Status"]}
          rows={loading ? [["Carregando...", "Estoque da sua conta", "", "", ""]] : rows}
        />
      </DataCard>
    </div>
  );
}

function ReportsView({
  sales,
  parts,
  clients,
  services,
  totals,
}: {
  sales: Sale[];
  parts: Part[];
  clients: Client[];
  services: ServiceOrder[];
  totals: ReturnType<typeof computeTotalsShape>;
}) {
  const reportRows = [
    ["Faturamento mensal", brl(totals.totalVendido), "Todas as categorias"],
    ["Lucro mensal", brl(totals.lucro), "Margem prevista"],
    [
      "Vendas por categoria",
      sales.map((sale) => sale.tipo).join(", "),
      "Celulares, peças e serviços",
    ],
    ["Vendas por modelo de iPhone", "iPhone 13, iPhone 11, iPhone 14 Pro Max", "Top modelos"],
    ["Peças mais vendidas", "Bateria, Tela, Película", "Ranking operacional"],
    [
      "Serviços mais feitos",
      services.map((service) => service.servico).join(", "),
      "Assistência técnica",
    ],
    ["Clientes que mais compram", clients.map((client) => client.nome).join(", "), "Base ativa"],
    [
      "Clientes inadimplentes",
      clients
        .filter((client) => client.aberto > 0)
        .map((client) => client.nome)
        .join(", "),
      "Cobrança",
    ],
    [
      "Estoque baixo",
      parts
        .filter((part) => part.quantidade <= part.minimo)
        .map((part) => part.tipo)
        .join(", "),
      "Reposição",
    ],
    ["Margem por produto", brl(totals.lucroPotencial), "Potencial de estoque"],
    ["Total fiado", brl(totals.totalFiado), "Em aberto"],
    ["Total recebido", brl(totals.totalRecebido), "Pagamentos"],
  ];

  return (
    <DataCard title="Relatórios da loja de iPhone">
      <ResponsiveTable columns={["Relatório", "Valor/Resumo", "Uso"]} rows={reportRows} />
    </DataCard>
  );
}

function SettingsView() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
      <DataCard title="Configurações da V2">
        <div className="grid gap-4">
          <Field label="Nome da loja" value="Fiado iPhones" />
          <Field label="WhatsApp padrão de cobrança" value="(11) 99999-0000" />
          <Field label="Garantia padrão de serviços" value="90 dias" />
          <Field label="Estoque mínimo padrão" value="2 unidades" />
          <Textarea
            className="min-h-[120px] rounded-2xl bg-surface"
            defaultValue="Olá, [nome]. Tudo bem? Passando para lembrar que ficou um valor em aberto de R$ [valor] referente à sua compra/serviço na loja. O vencimento é [data]. Pode me confirmar quando consegue realizar o pagamento?"
          />
          <Button onClick={() => toast.success("Configurações salvas")}>
            Salvar configurações
          </Button>
        </div>
      </DataCard>
      <DataCard title="Regras automáticas">
        <div className="grid gap-3 text-sm">
          {[
            "Baixar estoque automaticamente ao vender peça ou celular.",
            "Calcular lucro por aparelho, peça e serviço.",
            "Gerar cobrança para vendas fiadas e entrada + parcelas.",
            "Sinalizar estoque baixo com selo amarelo/vermelho.",
            "Separar clientes VIP, ativos e inadimplentes.",
          ].map((item) => (
            <div key={item} className="flex gap-3 rounded-2xl bg-surface-muted p-3">
              <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
              <span className="text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
      </DataCard>
    </div>
  );
}

function ImeiLookupCard({
  imei,
  apiKey,
  checking,
  result,
  onImeiChange,
  onApiKeyChange,
  onLookup,
  onCertificate,
}: {
  imei: string;
  apiKey: string;
  checking: boolean;
  result: ImeiCheckResult | null;
  onImeiChange: (value: string) => void;
  onApiKeyChange: (value: string) => void;
  onLookup: () => void;
  onCertificate: () => void;
}) {
  const normalized = onlyDigits(imei);
  const valid = isValidImei(normalized);

  return (
    <section className="mb-4 rounded-[24px] bg-surface p-4 shadow-soft sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Consulta de IMEI e certificado
            </h2>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
              Valida o IMEI, tenta consultar marca/modelo por provedor publico e gera um certificado
              de procedência para o aparelho.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={onLookup} disabled={checking} className="rounded-full">
            {checking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Consultar IMEI
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCertificate}
            disabled={!result}
            className="rounded-full"
          >
            <FileText className="h-4 w-4" />
            Gerar certificado
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
          IMEI do aparelho
          <Input
            value={imei}
            inputMode="numeric"
            maxLength={19}
            placeholder="Digite os 15 dígitos do IMEI"
            onChange={(event) => onImeiChange(event.target.value)}
            className="h-11 rounded-2xl bg-surface-muted"
          />
          <span className={valid ? "text-success" : "text-muted-foreground"}>
            {normalized.length === 15
              ? valid
                ? "IMEI válido pelo algoritmo Luhn"
                : "IMEI com dígito verificador inválido"
              : `${normalized.length}/15 dígitos`}
          </span>
        </Label>

        <Label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
          Chave opcional para consulta completa
          <Input
            value={apiKey}
            type="password"
            placeholder="Cole uma chave de provedor IMEI, se tiver"
            onChange={(event) => onApiKeyChange(event.target.value)}
            className="h-11 rounded-2xl bg-surface-muted"
          />
          <span>Sem chave, o sistema tenta consulta publica e mantém o pre-check local.</span>
        </Label>
      </div>

      {result && (
        <div className="mt-4 grid gap-3 xl:grid-cols-[0.8fr_1.2fr]">
          <div
            className={`rounded-[22px] p-4 ${
              result.status === "Aprovado"
                ? "bg-success/10 text-success"
                : result.status === "Atenção"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary"
            }`}
          >
            <p className="text-xs font-medium opacity-80">Status da procedência</p>
            <strong className="mt-2 block text-[26px] leading-none font-semibold">
              {result.status}
            </strong>
            <p className="mt-3 text-xs opacity-80">Fonte: {result.source}</p>
            <p className="mt-1 text-xs opacity-80">Certificado: {result.certificateId}</p>
          </div>

          <div className="grid gap-2 rounded-[22px] bg-surface-muted p-4 text-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="IMEI consultado" value={result.imei} />
              <Field label="Data da consulta" value={result.checkedAt} />
              <Field label="Marca" value={result.brand || "Não informado"} />
              <Field label="Modelo" value={result.name || result.model || "Não informado"} />
              <Field
                label="Blacklist"
                value={
                  result.blacklisted === null
                    ? "Não consultado"
                    : result.blacklisted
                      ? "Com alerta"
                      : "Sem alerta"
                }
              />
              <Field label="Origem" value={result.source} />
            </div>
            <div className="mt-2 rounded-2xl bg-surface p-3">
              <p className="mb-2 text-xs font-semibold text-foreground">Notas da verificação</p>
              <ul className="grid gap-1 text-xs text-muted-foreground">
                {result.notes.map((note) => (
                  <li key={note}>- {note}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function StockProductFormCard({
  id,
  form,
  onChange,
  onSave,
  onReset,
  onClose,
}: {
  id?: string;
  form: StockProductForm;
  onChange: (patch: Partial<StockProductForm>) => void;
  onSave: () => void | Promise<void>;
  onReset: () => void;
  onClose: () => void;
}) {
  const cost = moneyToNumber(form.valorCusto);
  const sale = moneyToNumber(form.valorVenda);
  const profit = Math.max(sale - cost, 0);
  const margin = sale > 0 ? (profit / sale) * 100 : 0;
  const markup = cost > 0 ? (profit / cost) * 100 : 0;
  const isPhone = form.kind === "Aparelho";
  const colorOptions = iphoneColorOptions(form.modelo);
  const updateModel = (modelo: string) => {
    onChange({
      modelo,
      cor: iphoneColorOptions(modelo).includes(form.cor) ? form.cor : "",
    });
  };

  return (
    <section
      id={id}
      className="mb-4 scroll-mt-6 overflow-hidden rounded-[24px] bg-surface shadow-soft"
    >
      <div className="border-b border-border/70 p-4 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <ClipboardList className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Cadastrar Produto em Estoque
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Base completa para aparelho, acessorio e peca, com custo, margem, fornecedor e dados
                fiscais.
              </p>
            </div>
          </div>

          <div className="flex overflow-x-auto rounded-2xl bg-surface-muted p-1">
            {(["Aparelho", "Acessório", "Peça"] as StockKind[]).map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => onChange({ kind })}
                className={`min-w-[110px] rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  form.kind === kind
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {kind}
              </button>
            ))}
          </div>
        </div>

        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
          {[
            "Dados gerais",
            "Contas a Pagar",
            "Forma de Pagamento",
            "Catalogo",
            "Custos extras",
            "Anexos",
            "Movimentacao de Estoque",
            "Checklist",
            "Outras informacoes",
          ].map((tab, index) => (
            <button
              key={tab}
              type="button"
              className={`shrink-0 rounded-full border px-3 py-2 text-[11px] font-semibold transition ${
                index === 0
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground"
              }`}
              onClick={() =>
                index === 0 ? undefined : toast.success(`${tab}: sera conectado na proxima etapa`)
              }
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 p-4 sm:p-5 xl:grid-cols-2">
        <div className="grid gap-3">
          <StockField
            label="Codigo"
            value={form.codigo}
            onChange={(codigo) => onChange({ codigo })}
          />
          <StockSelect
            required
            label="Tipo"
            value={form.tipo}
            onChange={(tipo) => onChange({ tipo })}
            options={
              isPhone
                ? ["Celular"]
                : form.kind === "Acessório"
                  ? ["Capinha", "Película", "Cabo", "Carregador", "Acessório"]
                  : partTypes
            }
          />
          <StockField label="SKU" value={form.sku} onChange={(sku) => onChange({ sku })} />
          <StockField
            type="date"
            label="Data de Entrada"
            value={form.dataEntrada}
            onChange={(dataEntrada) => onChange({ dataEntrada })}
          />
          {!isPhone && (
            <StockField
              required
              label="Nome produto"
              value={form.nome}
              placeholder="Ex: Tela iPhone 11 Incell"
              onChange={(nome) => onChange({ nome })}
            />
          )}
          <StockSelect
            label="Categoria"
            value={form.categoria}
            onChange={(categoria) => onChange({ categoria })}
            options={
              isPhone
                ? ["Novo", "Seminovo", "Usado", "Vitrine", "Sucata", "Retorno de assistência"]
                : [
                    "Original Apple",
                    "Original retirada",
                    "Premium",
                    "OLED",
                    "Incell",
                    "Nacional",
                    "Paralela",
                    "Recondicionada",
                  ]
            }
          />
          <StockField label="Marca" value={form.marca} onChange={(marca) => onChange({ marca })} />
          <StockField
            type="number"
            label="Quantidade"
            value={form.quantidade}
            onChange={(quantidade) => onChange({ quantidade })}
          />
          <StockField
            required
            label="Valor custo"
            value={form.valorCusto}
            placeholder="0,00"
            onChange={(valorCusto) => onChange({ valorCusto })}
          />
          <StockField label="Lucro" value={brl(profit)} readOnly onChange={() => undefined} />
          <StockField
            label="Mark-up %"
            value={`${markup.toFixed(1)}%`}
            readOnly
            onChange={() => undefined}
          />
          <StockField
            type="number"
            label="Dias de Garantia"
            value={form.diasGarantia}
            onChange={(diasGarantia) => onChange({ diasGarantia })}
          />
          <StockField
            label="Fornecedor"
            value={form.fornecedor}
            placeholder="Buscar fornecedor"
            onChange={(fornecedor) => onChange({ fornecedor })}
          />
          <StockArea
            label="Observacao"
            value={form.observacao}
            onChange={(observacao) => onChange({ observacao })}
          />
        </div>

        <div className="grid gap-3">
          {isPhone ? (
            <>
              <StockField label="IMEI" value={form.imei} onChange={(imei) => onChange({ imei })} />
              <StockField
                label="IMEI 2"
                value={form.imei2}
                onChange={(imei2) => onChange({ imei2 })}
              />
              <StockSelect
                required
                label="Modelo iPhone"
                value={form.modelo}
                onChange={updateModel}
                options={iphoneModels}
              />
              <StockField
                label="Serial number"
                value={form.serial}
                onChange={(serial) => onChange({ serial })}
              />
              <StockSelect
                label="Cor"
                value={form.cor}
                onChange={(cor) => onChange({ cor })}
                options={colorOptions}
              />
              <StockSelect
                label="GB"
                value={form.gb}
                onChange={(gb) => onChange({ gb })}
                options={["16GB", "32GB", "64GB", "128GB", "256GB", "512GB", "1TB", "2TB"]}
              />
              <StockField
                label="Memoria RAM"
                value={form.memoriaRam}
                onChange={(memoriaRam) => onChange({ memoriaRam })}
              />
              <StockSelect
                label="Estado do Aparelho"
                value={form.subcategoria}
                onChange={(subcategoria) => onChange({ subcategoria })}
                options={[
                  "Novo",
                  "Seminovo",
                  "Usado",
                  "Vitrine",
                  "Sucata",
                  "Retorno de assistência",
                ]}
              />
            </>
          ) : (
            <>
              <StockField
                label="Codigo de Barras"
                value={form.codigoBarras}
                onChange={(codigoBarras) => onChange({ codigoBarras })}
              />
              <StockField
                label="Serial number"
                value={form.serial}
                onChange={(serial) => onChange({ serial })}
              />
              <StockSelect
                required
                label="Disponibilidade"
                value={form.disponibilidade}
                onChange={(disponibilidade) => onChange({ disponibilidade })}
                options={["Disponível para venda", "Reservada", "Defeituosa", "Sem estoque"]}
              />
              <StockSelect
                label="Cor"
                value={form.cor}
                onChange={(cor) => onChange({ cor })}
                options={colorOptions}
              />
              <StockSelect
                label="Modelo compativel"
                value={form.modelo}
                onChange={updateModel}
                options={iphoneModels}
              />
              <StockField
                label="Subcategoria"
                value={form.subcategoria}
                onChange={(subcategoria) => onChange({ subcategoria })}
              />
            </>
          )}

          <StockField
            type="number"
            label="Quantidade minima"
            value={form.quantidadeMinima}
            onChange={(quantidadeMinima) => onChange({ quantidadeMinima })}
          />
          <StockField
            required
            label="Valor venda"
            value={form.valorVenda}
            placeholder="0,00"
            onChange={(valorVenda) => onChange({ valorVenda })}
          />
          <StockField
            label="Margem %"
            value={`${margin.toFixed(1)}%`}
            readOnly
            onChange={() => undefined}
          />
          <StockArea label="Tags" value={form.tags} onChange={(tags) => onChange({ tags })} />
        </div>
      </div>

      <div className="border-t border-border/70 p-4 sm:p-5">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Dados para Emissao de NF</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <StockField label="CEST" value={form.cest} onChange={(cest) => onChange({ cest })} />
          <StockField label="NCM" value={form.ncm} onChange={(ncm) => onChange({ ncm })} />
          <StockSelect
            label="Origem"
            value={form.origem}
            onChange={(origem) => onChange({ origem })}
            options={[
              "",
              "0 - Nacional",
              "1 - Estrangeira importacao direta",
              "2 - Estrangeira mercado interno",
            ]}
          />
          <StockField label="CST/CSOSN" value={form.cst} onChange={(cst) => onChange({ cst })} />
          <StockField
            label="CFOP Estadual (Saida)"
            value={form.cfopSaidaEstadual}
            onChange={(cfopSaidaEstadual) => onChange({ cfopSaidaEstadual })}
          />
          <StockField
            label="CFOP Interestadual (Saida)"
            value={form.cfopSaidaInterestadual}
            onChange={(cfopSaidaInterestadual) => onChange({ cfopSaidaInterestadual })}
          />
          <StockField
            label="CFOP Estadual (Entrada)"
            value={form.cfopEntradaEstadual}
            onChange={(cfopEntradaEstadual) => onChange({ cfopEntradaEstadual })}
          />
          <StockField
            label="CFOP Interestadual (Entrada)"
            value={form.cfopEntradaInterestadual}
            onChange={(cfopEntradaInterestadual) => onChange({ cfopEntradaInterestadual })}
          />
          <div className="md:col-span-2">
            <StockField
              label="Tributacao"
              value={form.tributacao}
              placeholder="Buscar regra fiscal"
              onChange={(tributacao) => onChange({ tributacao })}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-border/70 bg-surface-muted/45 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex flex-wrap gap-2">
          <Button onClick={onSave} className="rounded-full">
            <CheckCircle2 className="h-4 w-4" />
            Salvar
          </Button>
          <Button type="button" variant="outline" onClick={onReset} className="rounded-full">
            <Trash2 className="h-4 w-4" />
            Limpar formulario
          </Button>
          <Button type="button" variant="outline" onClick={onClose} className="rounded-full">
            <ArrowRight className="h-4 w-4 rotate-180" />
            Fechar
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => toast.success("Configurador de campos preparado")}
          className="rounded-full"
        >
          <Settings className="h-4 w-4" />
          Configurar campos
        </Button>
      </div>
    </section>
  );
}

function StockField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  readOnly,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
}) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center">
      <Label className="text-[12px] font-medium text-foreground/80">
        {required && <span className="text-destructive">* </span>}
        {label}
      </Label>
      <Input
        type={type}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`h-10 min-w-0 rounded-xl bg-surface-muted text-sm ${readOnly ? "border-primary/20 bg-primary/5 font-semibold text-foreground" : ""}`}
      />
    </div>
  );
}

function StockSelect({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
}) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center">
      <Label className="text-[12px] font-medium text-foreground/80">
        {required && <span className="text-destructive">* </span>}
        {label}
      </Label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 min-w-0 rounded-xl border border-border bg-surface-muted px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        <option value="">Selecionar</option>
        {options
          .filter((option) => option !== "")
          .map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
      </select>
    </div>
  );
}

function StockArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[150px_minmax(0,1fr)]">
      <Label className="pt-2 text-[12px] font-medium text-foreground/80">{label}</Label>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[88px] rounded-xl bg-surface-muted text-sm"
      />
    </div>
  );
}

function PageHeader({ active, onPrimary }: { active: TabId; onPrimary: () => void }) {
  const title = tabs.find((item) => item.id === active)?.label ?? "Dashboard";
  const copy: Record<TabId, string> = {
    dashboard: "Visão completa da loja: vendas, assistência, estoque, lucro e cobranças.",
    celulares: "Cadastre iPhones com IMEI, bateria, origem, custos, acessórios e status de venda.",
    pecas: "Controle peças por modelo, qualidade, fornecedor, preço, garantia e estoque.",
    servicos: "Ordens de serviço com diagnóstico, peça usada, mão de obra, prazo e garantia.",
    clientes: "Histórico de aparelhos, serviços, peças compradas e valores em aberto.",
    vendas: "Venda celular, peça, serviço ou combo com baixa de estoque e cálculo de lucro.",
    emprestimos: "Registre pecas emprestadas, acompanhe parcelas e valide pagamentos.",
    pagamentos: "Entradas e pagamentos vinculados a vendas, clientes e comprovantes.",
    cobrancas: "Cobranças de hoje, vencidas e próximas com mensagem pronta para WhatsApp.",
    estoque: "Visão de aparelhos, peças, acessórios, movimentação e lucro potencial.",
    relatorios: "Faturamento, margem, ranking de peças, modelos, serviços e inadimplência.",
    ia: "Assistente para duvidas e preenchimento automatico do catalogo de estoque.",
    configuracoes: "Preferências da V2 para loja de iPhones e assistência técnica.",
  };
  const button: Partial<Record<TabId, string>> = {
    celulares: "+ Adicionar iPhone",
    pecas: "+ Adicionar peça",
    servicos: "+ Novo serviço",
    clientes: "+ Novo cliente",
    vendas: "+ Nova venda",
    emprestimos: "+ Novo emprestimo",
    estoque: "+ Adicionar item",
    ia: "+ Usar IA",
  };
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground sm:text-[32px]">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{copy[active]}</p>
      </div>
      {button[active] && (
        <Button onClick={onPrimary} className="rounded-full px-5">
          <Plus className="h-4 w-4" />
          {button[active]}
        </Button>
      )}
    </div>
  );
}

function Filters({
  query,
  status,
  category,
  onQuery,
  onStatus,
  onCategory,
  categories,
}: {
  query: string;
  status: string;
  category: string;
  onQuery: (value: string) => void;
  onStatus: (value: string) => void;
  onCategory: (value: string) => void;
  categories: string[];
}) {
  return (
    <div className="mb-4 grid gap-3 rounded-[24px] bg-surface p-4 shadow-soft xl:grid-cols-[minmax(0,1fr)_190px_220px]">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          className="h-11 rounded-full bg-surface-muted pl-9"
          placeholder="Buscar por nome, modelo, IMEI, cliente, peça, status ou valor"
        />
      </div>
      <SelectLike
        value={status}
        onChange={onStatus}
        options={[
          "Todos",
          "Disponível",
          "Baixo estoque",
          "Sem estoque",
          "Vendido",
          "Reservado",
          "Em manutenção",
          "Pago",
          "Parcial",
          "Em aberto",
          "Atrasado",
          "Pronto",
          "VIP",
          "Inadimplente",
        ]}
      />
      <SelectLike value={category} onChange={onCategory} options={["Todos", ...categories]} />
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  dark,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: typeof LayoutGrid;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-[24px] p-5 shadow-soft ${dark ? "bg-ink text-ink-foreground shadow-ink" : "bg-surface text-foreground"}`}
    >
      <div className="mb-5 flex items-center justify-between">
        <div
          className={`grid h-10 w-10 place-items-center rounded-full ${dark ? "bg-white/10" : "bg-primary/10 text-primary"}`}
        >
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </div>
      </div>
      <p className={`text-xs ${dark ? "text-white/60" : "text-muted-foreground"}`}>{title}</p>
      <strong className="mt-2 block text-[28px] leading-none font-semibold tracking-tight">
        {value}
      </strong>
      <p className={`mt-3 text-[11px] ${dark ? "text-white/58" : "text-muted-foreground"}`}>
        {subtitle}
      </p>
    </div>
  );
}

function MiniMetric({
  title,
  value,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  icon: typeof LayoutGrid;
  tone?: "warning";
}) {
  return (
    <div className="rounded-[22px] bg-surface p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <span
          className={`grid h-9 w-9 place-items-center rounded-full ${tone === "warning" ? "bg-warning/15 text-warning" : "bg-primary/10 text-primary"}`}
        >
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div>
          <p className="text-[11px] text-muted-foreground">{title}</p>
          <strong className="text-[22px] leading-none font-semibold text-foreground">
            {value}
          </strong>
        </div>
      </div>
    </div>
  );
}

function ModuleCard({
  id,
  title,
  icon: Icon,
  action,
  children,
}: {
  id?: string;
  title: string;
  icon: typeof LayoutGrid;
  action: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="mb-4 scroll-mt-6 rounded-[24px] bg-surface p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        </div>
        <div className="shrink-0">{action}</div>
      </div>
      {children}
    </div>
  );
}

function DataCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-[24px] bg-surface p-4 shadow-soft sm:p-5">
      {title && <h2 className="mb-4 text-sm font-semibold text-foreground">{title}</h2>}
      {children}
    </section>
  );
}

function ResponsiveTable({ columns, rows }: { columns: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="no-scrollbar min-w-0 overflow-x-auto">
      <table className="w-full min-w-[780px] text-left">
        <thead>
          <tr className="border-b border-border">
            {columns.map((column) => (
              <th
                key={column}
                className="px-2 py-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, index) => (
              <tr key={index} className="border-b border-border/70 last:border-0">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="max-w-[290px] px-2 py-4 align-middle text-[13px] text-foreground"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="py-12 text-center text-sm text-muted-foreground"
              >
                Nenhum registro encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function SelectLike({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 min-w-0 rounded-full border border-border bg-surface-muted px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function ItemTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-medium text-foreground">{title}</p>
      <p className="mt-1 truncate text-[11px] text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone = ["Pago", "Disponível", "Entregue", "VIP", "Ativo"].includes(status)
    ? "bg-success/10 text-success"
    : ["Atrasado", "Inadimplente", "Bloqueado", "Sem estoque", "Cancelado"].includes(status)
      ? "bg-destructive/10 text-destructive"
      : ["Baixo estoque", "Aguardando peça", "Reservado", "Parcial"].includes(status)
        ? "bg-warning/15 text-warning"
        : "bg-primary/10 text-primary";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone}`}>
      {status}
    </span>
  );
}

function StockPill({ part }: { part: Part }) {
  const status =
    part.quantidade <= 0
      ? "Sem estoque"
      : part.quantidade <= part.minimo
        ? "Baixo estoque"
        : part.status;
  return <StatusPill status={status} />;
}

function Actions({ onDelete }: { onDelete: () => void }) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <ActionButton icon={Eye} label="Ver" onClick={() => toast.success("Visualização aberta")} />
      <ActionButton
        icon={PenLine}
        label="Editar"
        onClick={() => toast.success("Edição pronta para conectar")}
      />
      <ActionButton
        icon={BadgeDollarSign}
        label="Vender"
        onClick={() => toast.success("Venda iniciada")}
      />
      <ActionButton icon={Trash2} label="Excluir" onClick={onDelete} danger />
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof LayoutGrid;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-full transition ${
        danger
          ? "bg-destructive/10 text-destructive hover:bg-destructive hover:text-white"
          : "bg-surface-muted text-foreground/70 hover:bg-primary/10 hover:text-primary"
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function RankList({ items }: { items: string[] }) {
  return (
    <div className="grid gap-2">
      {(items.length ? items : ["Sem dados ainda"]).map((item, index) => (
        <div key={item} className="flex items-center gap-3 rounded-2xl bg-surface-muted p-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {index + 1}
          </span>
          <span className="min-w-0 truncate text-sm font-medium text-foreground">{item}</span>
        </div>
      ))}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
      {label}
      <Input defaultValue={value} className="h-11 rounded-2xl bg-surface" />
    </Label>
  );
}

function GeneratedPartsPreview() {
  const generated = [
    "Bateria",
    "Tela frontal",
    "Tampa traseira",
    "Câmera traseira",
    "Flex de carga",
    "Película",
    "Capinha",
  ].flatMap((type) =>
    [
      "iPhone 11",
      "iPhone 12",
      "iPhone 13",
      "iPhone 14 Pro Max",
      "iPhone 15 Pro Max",
      "iPhone 16 Pro Max",
      "iPhone 17 Pro Max",
    ].map((model) => `${type} ${model}`),
  );
  return (
    <div className="mb-4 rounded-[24px] bg-surface p-4 shadow-soft">
      <div className="mb-3 flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">
          Combinações automáticas por modelo
        </h2>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {generated.slice(0, 28).map((item) => (
          <span
            key={item}
            className="shrink-0 rounded-full bg-surface-muted px-3 py-2 text-xs font-medium text-muted-foreground"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function moneyToNumber(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  return Math.max(0, Number(normalized) || 0);
}

function numericIdFromString(value: string) {
  return Math.abs(value.split("").reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) | 0, 0));
}

function inventoryMeta<K extends LojaInventoryMeta["kind"]>(
  kind: K,
  data: K extends "phone" ? Phone : Part,
): LojaInventoryMeta {
  const { id: _id, productId: _productId, ...cleanData } = data;
  return {
    app: "lojadeiphone",
    version: 1,
    kind,
    data: cleanData,
  } as LojaInventoryMeta;
}

function parseInventoryProduct(row: InventoryProductRow) {
  if (!row.observacoes) return null;

  try {
    const meta = JSON.parse(row.observacoes) as LojaInventoryMeta;
    if (meta.app !== "lojadeiphone" || meta.version !== 1) return null;

    if (meta.kind === "phone") {
      return {
        kind: "phone" as const,
        item: {
          ...meta.data,
          id: numericIdFromString(row.id),
          productId: row.id,
          precoVenda: Number(row.preco_venda) || meta.data.precoVenda,
          status: (row.status as PhoneStatus) || meta.data.status,
        },
      };
    }

    return {
      kind: "part" as const,
      item: {
        ...meta.data,
        id: numericIdFromString(row.id),
        productId: row.id,
        preco: Number(row.preco_venda) || meta.data.preco,
        quantidade: Number(row.quantidade) || meta.data.quantidade,
        minimo: Number(row.estoque_minimo) || meta.data.minimo,
        status: (row.status as Part["status"]) || meta.data.status,
      },
    };
  } catch {
    return null;
  }
}

async function saveLojaInventoryProduct({
  userId,
  kind,
  name,
  sku,
  salePrice,
  quantity,
  minimum,
  status,
  data,
}: {
  userId: string;
  kind: "phone" | "part";
  name: string;
  sku: string;
  salePrice: number;
  quantity: number;
  minimum: number;
  status: string;
  data: Phone | Part;
}) {
  const meta = inventoryMeta(kind, data as Phone & Part);
  const { data: saved, error } = await supabase
    .from("products")
    .insert({
      user_id: userId,
      nome: name,
      sku,
      preco_venda: salePrice,
      quantidade: quantity,
      estoque_minimo: minimum,
      status,
      observacoes: JSON.stringify(meta),
    })
    .select("id,nome,sku,preco_venda,quantidade,estoque_minimo,status,observacoes")
    .maybeSingle();

  if (error || !saved) {
    toast.error("Nao consegui salvar o item no banco da sua conta");
    return null;
  }

  const parsed = parseInventoryProduct(saved as InventoryProductRow);
  return parsed?.item ?? null;
}

function dateToISO(date: Date) {
  return date.toISOString().slice(0, 10);
}

function nextDueDate(baseISO: string, chargeDay: number) {
  const base = new Date(`${baseISO}T12:00:00`);
  const target = new Date(base.getFullYear(), base.getMonth(), 1, 12);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(chargeDay, lastDay));
  if (target <= base) {
    target.setMonth(target.getMonth() + 1, 1);
    const nextLastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    target.setDate(Math.min(chargeDay, nextLastDay));
  }
  return dateToISO(target);
}

function buildLoanSchedule({
  firstDueDate,
  chargeDay,
  count,
  total,
}: {
  firstDueDate: string;
  chargeDay: number;
  count: number;
  total: number;
}) {
  const installmentValue = Number((total / count).toFixed(2));
  const roundedTotal = installmentValue * count;
  const correction = Number((total - roundedTotal).toFixed(2));
  const firstDate = new Date(`${firstDueDate}T12:00:00`);

  return Array.from({ length: count }, (_, index): LoanInstallment => {
    const dueDate = new Date(firstDate.getFullYear(), firstDate.getMonth() + index, 1, 12);
    const lastDay = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0).getDate();
    dueDate.setDate(Math.min(chargeDay, lastDay));
    return {
      id: Date.now() + index + 1,
      numero: index + 1,
      vencimento: dateToISO(dueDate),
      valor: Number((installmentValue + (index === count - 1 ? correction : 0)).toFixed(2)),
      status: dateToISO(dueDate) < today ? "vencido" : "pendente",
    };
  });
}

function stockStatus(quantity: number, minQuantity: number) {
  return (
    quantity <= 0
      ? "Sem estoque"
      : minQuantity > 0 && quantity <= minQuantity
        ? "Baixo estoque"
        : "Disponível"
  ) as Part["status"];
}

function parseAiJson(content: string): {
  answer?: string;
  questions?: string[];
  parts?: AiCatalogPart[];
} {
  const clean = content
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) return {};

  try {
    return JSON.parse(clean.slice(start, end + 1));
  } catch {
    return {};
  }
}

function sanitizeAiParts(parts: AiCatalogPart[]) {
  return parts
    .filter((part) => part.tipo || part.modelo)
    .map((part) => {
      const quantity = Math.max(1, Number(part.quantidade) || 1);
      const cost = Math.max(0, Number(part.custo) || 0);
      const price = Math.max(0, Number(part.preco) || 0);
      const installedPrice = Math.max(price, Number(part.precoInstalado) || price);
      const minimum = Math.max(0, Number(part.minimo) || 1);
      const quality = partQualityOptions.includes(part.qualidade) ? part.qualidade : "Premium";
      const normalizedType = normalizeSearch(part.tipo);
      const type =
        partTypes.find((item) => normalizeSearch(item) === normalizedType) ||
        partTypes.find((item) => normalizedType.includes(normalizeSearch(item))) ||
        part.tipo ||
        "Peca";
      const model =
        iphoneModels.find((item) => normalizeSearch(part.modelo).includes(normalizeSearch(item))) ||
        part.modelo ||
        "Modelo a confirmar";

      return {
        tipo: type,
        modelo: model,
        qualidade: quality,
        fornecedor: part.fornecedor || "",
        custo: cost,
        preco: price,
        precoInstalado: installedPrice,
        quantidade: quantity,
        minimo: minimum,
        localizacao: part.localizacao || "",
        garantia: Math.max(0, Number(part.garantia) || 30),
        observacoes: part.observacoes || "",
        precisaRevisao:
          Boolean(part.precisaRevisao) ||
          !part.modelo ||
          !part.tipo ||
          !part.quantidade ||
          !part.preco ||
          !part.qualidade,
      };
    });
}

function parseCatalogText(text: string): AiCatalogPart[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const normalized = normalizeSearch(line);
      const quantityMatch = line.match(/(?:^|\s)(\d+)\s*(?:un|und|unidades|x)?/i);
      const moneyMatches = [...line.matchAll(/(?:r\$)?\s*(\d+(?:[.,]\d{1,2})?)/gi)]
        .map((match) => Number(match[1].replace(",", ".")))
        .filter((value) => value > 0);
      const type =
        partTypes.find((item) => normalized.includes(normalizeSearch(item))) ||
        (normalized.includes("tela") ? "Tela frontal" : "") ||
        (normalized.includes("bateria") ? "Bateria" : "") ||
        "Peca";
      const model =
        iphoneModels.find((item) => normalized.includes(normalizeSearch(item))) ||
        "Modelo a confirmar";
      const quality =
        partQualityOptions.find((item) => normalized.includes(normalizeSearch(item))) ||
        (normalized.includes("incell") ? "Incell" : "") ||
        (normalized.includes("oled") ? "OLED" : "") ||
        "Premium";
      const quantity = quantityMatch ? Math.max(1, Number(quantityMatch[1])) : 1;
      const cost = moneyMatches.length >= 2 ? moneyMatches[0] : 0;
      const price = moneyMatches.length >= 2 ? moneyMatches[1] : moneyMatches[0] || 0;

      return {
        tipo: type,
        modelo: model,
        qualidade: quality,
        fornecedor: "",
        custo: cost,
        preco: price,
        precoInstalado: price,
        quantidade: quantity,
        minimo: 1,
        localizacao: "",
        garantia: 30,
        observacoes: line,
        precisaRevisao: model === "Modelo a confirmar" || price <= 0,
      };
    });
}

function buildAiQuestions(parts: AiCatalogPart[]) {
  const questions = new Set<string>();
  for (const part of parts) {
    if (!part.modelo || part.modelo === "Modelo a confirmar") {
      questions.add("Qual modelo de iPhone cada peca atende?");
    }
    if (!part.preco) questions.add("Qual preco de venda devo colocar nos itens sem preco?");
    if (!part.fornecedor) questions.add("Deseja informar fornecedor para estes itens?");
    if (!part.localizacao)
      questions.add("Onde esses itens ficam no estoque: gaveta, caixa ou prateleira?");
  }
  return [...questions];
}

function localFiadoAnswer(mode: "duvida" | "catalogo", count: number, prompt: string) {
  const normalized = normalizeSearch(prompt);
  if (mode === "duvida") {
    if (
      normalized.includes("quantos") &&
      (normalized.includes("aparelhos") ||
        normalized.includes("celulares") ||
        normalized.includes("iphone"))
    ) {
      return "Na tela atual, o cadastro completo de iPhone e feito um aparelho por vez pelo botao + Adicionar iPhone, porque cada unidade precisa de IMEI, serial, cor, bateria, custo e status proprios. Para pecas, voce pode colar uma lista grande na aba IA e importar varios itens para o estoque depois de revisar.";
    }

    if (normalized.includes("cadastrar") && normalized.includes("peca")) {
      return "Para cadastrar pecas em lote, va na aba IA, selecione Preencher catalogo, cole a lista com tipo, modelo, quantidade, custo e preco, revise o resultado e clique em Adicionar ao estoque. Se faltar dado, a IA vai listar as perguntas antes de importar.";
    }

    if (normalized.includes("emprestimo")) {
      return "Na aba Emprestimos voce informa cliente, peca ou celular emprestado, valor, entrada, parcelas, dia de cobranca e primeira parcela. O sistema cria as cobrancas e depois voce valida cada pagamento pelo botao Validar pagamento.";
    }

    if (
      normalized.includes("cliente") &&
      (normalized.includes("b2b") || normalized.includes("b2c"))
    ) {
      return "Na aba Clientes voce pode cadastrar B2C para venda final e B2B para revenda. Tambem da para importar uma lista no formato nome; whatsapp; cpf/cnpj; observacao.";
    }

    return "Posso responder sobre como usar o Fiado: cadastro de iPhones, pecas, servicos, clientes B2B/B2C, vendas a vista, fiado, emprestimos, cobrancas, pagamentos, estoque, relatorios e IA de catalogo. Pergunte do jeito que voce falaria no balcão.";
  }
  return count
    ? `Preparei ${count} itens para revisao antes de adicionar ao estoque.`
    : "Nao consegui identificar itens de estoque. Cole uma lista com tipo, modelo, quantidade e preco.";
}

function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function isValidImei(value: string) {
  if (!/^\d{15}$/.test(value)) return false;
  const sum = value
    .split("")
    .map(Number)
    .reduce((acc, digit, index) => {
      if (index % 2 === 0) return acc + digit;
      const doubled = digit * 2;
      return acc + (doubled > 9 ? doubled - 9 : doubled);
    }, 0);
  return sum % 10 === 0;
}

function buildImeiCertificateHtml(result: ImeiCheckResult, operator: string) {
  const statusColor =
    result.status === "Aprovado" ? "#16a34a" : result.status === "Atenção" ? "#dc2626" : "#5b55ff";
  const blacklist =
    result.blacklisted === null
      ? "Não consultado"
      : result.blacklisted
        ? "Com alerta"
        : "Sem alerta";
  const brand = escapeHtml(result.brand || "Não informado");
  const model = escapeHtml(result.name || result.model || "Não informado");
  const notes = result.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("");

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Certificado IMEI ${escapeHtml(result.imei)}</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; padding: 40px; font-family: Inter, Arial, sans-serif; background: #f5f6fa; color: #111827; }
      .sheet { max-width: 820px; margin: 0 auto; border-radius: 28px; background: #fff; padding: 42px; box-shadow: 0 24px 80px rgba(17, 24, 39, .12); }
      .top { display: flex; justify-content: space-between; gap: 24px; border-bottom: 1px solid #e5e7eb; padding-bottom: 24px; }
      .brand { font-size: 22px; font-weight: 800; color: #5b55ff; }
      .badge { border-radius: 999px; background: ${statusColor}; color: #fff; padding: 10px 16px; font-size: 12px; font-weight: 800; text-transform: uppercase; }
      h1 { margin: 34px 0 8px; font-size: 34px; line-height: 1.05; }
      p { color: #6b7280; line-height: 1.6; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 28px; }
      .field { border-radius: 18px; background: #f3f4f6; padding: 16px; }
      .label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: .04em; }
      .value { margin-top: 8px; font-weight: 800; }
      .notes { margin-top: 24px; border-radius: 20px; border: 1px solid #e5e7eb; padding: 18px; }
      li { margin: 8px 0; color: #4b5563; }
      .footer { margin-top: 34px; display: flex; justify-content: space-between; color: #6b7280; font-size: 12px; }
      @media print { body { background: #fff; padding: 0; } .sheet { box-shadow: none; } }
    </style>
  </head>
  <body>
    <main class="sheet">
      <div class="top">
        <div>
          <div class="brand">Fiado.</div>
          <p>Certificado de consulta e procedência de aparelho</p>
        </div>
        <div class="badge">${escapeHtml(result.status)}</div>
      </div>
      <h1>Certificado IMEI</h1>
      <p>Este documento registra a consulta feita no sistema Fiado para apoio na compra, venda ou assistência técnica do aparelho.</p>
      <section class="grid">
        <div class="field"><div class="label">Certificado</div><div class="value">${escapeHtml(result.certificateId)}</div></div>
        <div class="field"><div class="label">IMEI</div><div class="value">${escapeHtml(result.imei)}</div></div>
        <div class="field"><div class="label">Fonte</div><div class="value">${escapeHtml(result.source)}</div></div>
        <div class="field"><div class="label">Data</div><div class="value">${escapeHtml(result.checkedAt)}</div></div>
        <div class="field"><div class="label">Marca</div><div class="value">${brand}</div></div>
        <div class="field"><div class="label">Modelo</div><div class="value">${model}</div></div>
        <div class="field"><div class="label">Blacklist</div><div class="value">${escapeHtml(blacklist)}</div></div>
        <div class="field"><div class="label">Operador</div><div class="value">${escapeHtml(operator)}</div></div>
      </section>
      <section class="notes">
        <strong>Notas da verificação</strong>
        <ul>${notes}</ul>
      </section>
      <div class="footer">
        <span>Fiado SaaS - Loja de iPhone</span>
        <span>Documento gerado automaticamente</span>
      </div>
    </main>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char] ?? char;
  });
}

function matchesFilters(fields: unknown[], query: string, statusFilter: string, status: string) {
  return searchIn(fields, query) && (statusFilter === "Todos" || status === statusFilter);
}

function searchIn(fields: unknown[], query: string) {
  const term = query.trim().toLowerCase();
  if (!term) return true;
  return fields.some((field) =>
    String(field ?? "")
      .toLowerCase()
      .includes(term),
  );
}

function computeTotalsShape() {
  return {
    totalVendido: 0,
    totalRecebido: 0,
    totalFiado: 0,
    lowStock: [] as Part[],
    availablePhones: 0,
    openClients: 0,
    activeServices: [] as ServiceOrder[],
    lucro: 0,
    estoqueParado: 0,
    lucroPotencial: 0,
  };
}
