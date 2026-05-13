import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { brl } from "@/lib/format";

export const Route = createFileRoute("/lojadeiphone")({
  head: () => ({
    meta: [
      { title: "Loja de iPhone - Fiado V2" },
      {
        name: "description",
        content:
          "V2 do Fiado para lojas de iPhone, peÃƒÂ§as, assistÃƒÂªncia tÃƒÂ©cnica e cobranÃƒÂ§as.",
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
  | "pagamentos"
  | "cobrancas"
  | "estoque"
  | "relatorios"
  | "configuracoes";

type PhoneStatus =
  | "DisponÃƒÂ­vel"
  | "Vendido"
  | "Reservado"
  | "Em manutenÃƒÂ§ÃƒÂ£o"
  | "Fiado"
  | "Consignado";
type SaleStatus = "Pago" | "Parcial" | "Em aberto" | "Atrasado";
type ServiceStatus =
  | "Recebido"
  | "Em diagnÃƒÂ³stico"
  | "Aguardando peÃƒÂ§a"
  | "Em manutenÃƒÂ§ÃƒÂ£o"
  | "Pronto"
  | "Entregue"
  | "Cancelado";

type Phone = {
  id: number;
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
  status: "DisponÃƒÂ­vel" | "Baixo estoque" | "Sem estoque" | "Reservada" | "Defeituosa";
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
};

type Sale = {
  id: number;
  cliente: string;
  tipo: "Celular" | "PeÃƒÂ§a" | "ServiÃƒÂ§o" | "Combo";
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

const tabs: { id: TabId; label: string; icon: typeof LayoutGrid }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { id: "celulares", label: "Celulares", icon: Smartphone },
  { id: "pecas", label: "PeÃƒÂ§as", icon: Package },
  { id: "servicos", label: "ServiÃƒÂ§os", icon: Wrench },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "vendas", label: "Vendas", icon: BadgeDollarSign },
  { id: "pagamentos", label: "Pagamentos", icon: CreditCard },
  { id: "cobrancas", label: "CobranÃƒÂ§as", icon: BellRing },
  { id: "estoque", label: "Estoque", icon: Boxes },
  { id: "relatorios", label: "RelatÃƒÂ³rios", icon: BarChart3 },
  { id: "configuracoes", label: "ConfiguraÃƒÂ§ÃƒÂµes", icon: Settings },
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
  "iPhone SE 3Ã‚Âª geraÃƒÂ§ÃƒÂ£o",
  "iPhone 13 Pro Max",
  "iPhone 13 Pro",
  "iPhone 13",
  "iPhone 13 mini",
  "iPhone 12 Pro Max",
  "iPhone 12 Pro",
  "iPhone 12",
  "iPhone 12 mini",
  "iPhone SE 2Ã‚Âª geraÃƒÂ§ÃƒÂ£o",
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
  "iPhone SE 1Ã‚Âª geraÃƒÂ§ÃƒÂ£o",
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

const partTypes = [
  "Bateria",
  "Tela frontal",
  "Display OLED",
  "Display LCD/Incell",
  "Touch",
  "Vidro frontal",
  "Tampa traseira",
  "Vidro traseiro",
  "CarcaÃƒÂ§a",
  "Aro lateral",
  "Lente da cÃƒÂ¢mera traseira",
  "CÃƒÂ¢mera traseira",
  "CÃƒÂ¢mera frontal",
  "Sensor de proximidade",
  "Flex do Face ID",
  "Flex do botÃƒÂ£o power",
  "Flex do botÃƒÂ£o volume",
  "Flex do botÃƒÂ£o silencioso",
  "Flex de carga",
  "Dock de carga",
  "Conector de carga Lightning",
  "Conector de carga USB-C",
  "Microfone",
  "Alto-falante auricular",
  "Alto-falante viva-voz/campainha",
  "Taptic Engine/vibracall",
  "Bandeja SIM",
  "BotÃƒÂ£o home",
  "Touch ID",
  "Placa lÃƒÂ³gica",
  "Placa de carga",
  "Antena",
  "Cabo coaxial",
  "Parafusos",
  "Blindagem metÃƒÂ¡lica",
  "Adesivo de vedaÃƒÂ§ÃƒÂ£o da tela",
  "Adesivo da bateria",
  "PelÃƒÂ­cula",
  "Capinha",
  "Cabo",
  "Carregador",
  "Conector interno",
  "Sensor de luz",
  "MÃƒÂ³dulo Wi-Fi/Bluetooth",
  "MÃƒÂ³dulo TrueDepth",
  "Flash",
  "Scanner LiDAR",
  "Suporte de cÃƒÂ¢mera",
  "Grade auricular",
  "Malha de alto-falante",
];

const serviceTypes = [
  "Troca de bateria",
  "Troca de tela",
  "Troca de vidro traseiro",
  "Troca de tampa traseira",
  "Troca de cÃƒÂ¢mera traseira",
  "Troca de cÃƒÂ¢mera frontal",
  "Troca de lente da cÃƒÂ¢mera",
  "Troca de conector de carga",
  "Troca de alto-falante",
  "Troca de auricular",
  "Troca de microfone",
  "Troca de botÃƒÂ£o power",
  "Troca de botÃƒÂ£o volume",
  "Reparo de Face ID",
  "Reparo de placa",
  "Limpeza interna",
  "DiagnÃƒÂ³stico tÃƒÂ©cnico",
  "AtualizaÃƒÂ§ÃƒÂ£o/restauraÃƒÂ§ÃƒÂ£o",
  "RemoÃƒÂ§ÃƒÂ£o de oxidaÃƒÂ§ÃƒÂ£o",
  "InstalaÃƒÂ§ÃƒÂ£o de pelÃƒÂ­cula",
  "InstalaÃƒÂ§ÃƒÂ£o de capinha",
  "Venda de acessÃƒÂ³rio",
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
    telaOriginal: "NÃƒÂ£o sei",
    bateriaOriginal: "Sim",
    aberto: "NÃƒÂ£o sei",
    bloqueio: "Desbloqueado",
    acompanha: ["Cabo", "PelÃƒÂ­cula"],
    custoCompra: 1250,
    custoManutencao: 80,
    precoVenda: 1890,
    status: "DisponÃƒÂ­vel",
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
    aberto: "NÃƒÂ£o",
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
    aberto: "NÃƒÂ£o",
    bloqueio: "Desbloqueado",
    acompanha: ["Caixa", "Cabo", "Capinha"],
    custoCompra: 4200,
    custoManutencao: 120,
    precoVenda: 5390,
    status: "Reservado",
    observacoes: "Reservado para retirada amanhÃƒÂ£.",
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
    status: "DisponÃƒÂ­vel",
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
    status: "DisponÃƒÂ­vel",
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
    nome: "JoÃƒÂ£o Silva",
    whatsapp: "1199999-1001",
    cpf: "",
    endereco: "Centro",
    compras: 3,
    totalComprado: 2940,
    aberto: 350,
    aparelhos: ["iPhone 11 128GB"],
    servicos: ["Troca de bateria"],
    pecas: ["PelÃƒÂ­cula iPhone 11"],
    status: "Inadimplente",
  },
  {
    id: 2,
    nome: "Maria Santos",
    whatsapp: "1199999-1002",
    cpf: "",
    endereco: "Jardim AmÃƒÂ©rica",
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
    cliente: "JoÃƒÂ£o Silva",
    whatsapp: "1199999-1001",
    modelo: "iPhone 11",
    imei: "356789110000001",
    problema: "Bateria descarregando rÃƒÂ¡pido.",
    diagnostico: "SaÃƒÂºde baixa e ciclos altos.",
    servico: "Troca de bateria",
    peca: "Bateria iPhone 11",
    custoPeca: 78,
    maoObra: 120,
    entrada: 100,
    formaPagamento: "Fiado",
    status: "Em manutenÃƒÂ§ÃƒÂ£o",
    prazo: "2026-05-13",
    garantia: 90,
    observacoes: "Cliente pediu entrega no fim do dia.",
  },
];

const seedSales: Sale[] = [
  {
    id: 1,
    cliente: "JoÃƒÂ£o Silva",
    tipo: "ServiÃƒÂ§o",
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
    tipo: "PeÃƒÂ§a",
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
    cliente: "Cliente balcÃƒÂ£o",
    tipo: "Celular",
    item: "iPhone 13 128GB Azul",
    quantidade: 1,
    unitario: 2850,
    desconto: 0,
    pagamento: "CartÃƒÂ£o",
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
    cliente: "Cliente balcÃƒÂ£o",
    venda: "iPhone 13 128GB Azul",
    valor: 2850,
    forma: "CartÃƒÂ£o",
    data: "2026-05-12",
    observacoes: "CrÃƒÂ©dito 1x.",
  },
];

const today = "2026-05-12";

function LojaDeIphonePage() {
  const { session, loading, signOut, user } = useAuth();
  const [active, setActive] = useState<TabId>("dashboard");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [phones, setPhones] = useState<Phone[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [services, setServices] = useState<ServiceOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [newPhone, setNewPhone] = useState({ modelo: "iPhone 11", capacidade: "128GB", cor: "" });
  const [newPart, setNewPart] = useState({ tipo: "Bateria", modelo: "iPhone 11", quantidade: "1" });
  const [newService, setNewService] = useState({
    cliente: "",
    modelo: "iPhone 11",
    servico: "Troca de bateria",
  });
  const [newSale, setNewSale] = useState({
    cliente: "",
    tipo: "PeÃƒÂ§a" as Sale["tipo"],
    item: "",
    valor: "",
    entrada: "",
    parcelas: "1",
  });

  const firstName =
    user?.user_metadata?.nome?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "Andre";
  const email = user?.email ?? "andre@lojaiphone.com";
  const initials = firstName.slice(0, 1).toUpperCase();

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
    const availablePhones = phones.filter((item) => item.status === "DisponÃƒÂ­vel").length;
    const openClients = clients.filter((item) => item.aberto > 0).length;
    const activeServices = services.filter((item) =>
      [
        "Recebido",
        "Em diagnÃƒÂ³stico",
        "Aguardando peÃƒÂ§a",
        "Em manutenÃƒÂ§ÃƒÂ£o",
        "Pronto",
      ].includes(item.status),
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
  const filteredClients = clients.filter((item) =>
    matchesFilters(
      [item.nome, item.whatsapp, item.cpf, item.status],
      query,
      statusFilter,
      item.status,
    ),
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
  const filteredPayments = payments.filter((item) =>
    searchIn([item.cliente, item.venda, item.forma, item.data], query),
  );
  const charges = sales
    .filter((sale) => sale.status !== "Pago")
    .map((sale) => ({
      ...sale,
      aberto: Math.max(sale.unitario * sale.quantidade - sale.desconto - sale.entrada, 0),
      atraso: sale.vencimento < today,
    }));
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

  function resetFilters(tab: TabId) {
    setActive(tab);
    setQuery("");
    setStatusFilter("Todos");
    setCategoryFilter("Todos");
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
      telaOriginal: "NÃƒÂ£o sei",
      bateriaOriginal: "NÃƒÂ£o sei",
      aberto: "NÃƒÂ£o sei",
      bloqueio: "Desbloqueado",
      acompanha: ["Cabo"],
      custoCompra: 0,
      custoManutencao: 0,
      precoVenda: 0,
      status: "DisponÃƒÂ­vel",
      observacoes: "Cadastro rÃƒÂ¡pido. Complete os detalhes no editar.",
    };
    setPhones((items) => [phone, ...items]);
    toast.success("Celular cadastrado");
  }

  function addPart() {
    const quantity = Math.max(0, Number(newPart.quantidade) || 0);
    const part: Part = {
      id: Date.now(),
      tipo: newPart.tipo,
      modelo: newPart.modelo,
      qualidade: "Premium",
      sku: `${newPart.tipo.slice(0, 3).toUpperCase()}-${newPart.modelo.replace(/\s/g, "-").toUpperCase()}`,
      fornecedor: "Fornecedor padrÃƒÂ£o",
      custo: 0,
      preco: 0,
      precoInstalado: 0,
      quantidade: quantity,
      minimo: 2,
      localizacao: "Sem localizaÃƒÂ§ÃƒÂ£o",
      garantia: 90,
      status: quantity <= 0 ? "Sem estoque" : quantity <= 2 ? "Baixo estoque" : "DisponÃƒÂ­vel",
    };
    setParts((items) => [part, ...items]);
    toast.success("PeÃƒÂ§a cadastrada");
  }

  function addService() {
    const service: ServiceOrder = {
      id: Date.now(),
      cliente: newService.cliente || "Cliente balcÃƒÂ£o",
      whatsapp: "",
      modelo: newService.modelo,
      imei: "",
      problema: "Aguardando diagnÃƒÂ³stico.",
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
      observacoes: "Ordem criada pelo cadastro rÃƒÂ¡pido.",
    };
    setServices((items) => [service, ...items]);
    toast.success("Ordem de serviÃƒÂ§o criada");
  }

  function addSale() {
    const value = Number(newSale.valor) || 0;
    const entry = Number(newSale.entrada) || 0;
    if (!newSale.item || value <= 0) {
      toast.error("Informe item e valor da venda");
      return;
    }
    const sale: Sale = {
      id: Date.now(),
      cliente: newSale.cliente || "Cliente balcÃƒÂ£o",
      tipo: newSale.tipo,
      item: newSale.item,
      quantidade: 1,
      unitario: value,
      desconto: 0,
      pagamento: entry >= value ? "Pix" : "Entrada + parcelas",
      entrada: entry,
      parcelas: Math.max(1, Number(newSale.parcelas) || 1),
      vencimento: "2026-06-12",
      status: entry >= value ? "Pago" : entry > 0 ? "Parcial" : "Em aberto",
      lucro: Math.max(value * 0.35, 0),
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
                    : "DisponÃƒÂ­vel",
            }
          : part,
      ),
    );
    toast.success("Venda registrada e estoque atualizado");
  }

  function removeById<T extends { id: number }>(
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    id: number,
  ) {
    setter((items) => items.filter((item) => item.id !== id));
    toast.success("Item excluÃƒÂ­do");
  }

  function markChargePaid(id: number) {
    setSales((items) =>
      items.map((item) =>
        item.id === id ? { ...item, status: "Pago", entrada: item.unitario - item.desconto } : item,
      ),
    );
    toast.success("CobranÃƒÂ§a marcada como paga");
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
          <p className="mt-3 text-[11px] text-muted-foreground">
            ÃƒÅ¡ltima atualizaÃƒÂ§ÃƒÂ£o: hoje
          </p>
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
              <p className="text-[10.5px] text-white/60">CobranÃƒÂ§as do mÃƒÂªs</p>
              <p className="mt-0.5 text-[22px] leading-none font-semibold">{charges.length}</p>
            </div>
          </div>
          <p className="mt-3 text-[10.5px] text-white/60">clientes com pendÃƒÂªncia</p>
          <button
            type="button"
            onClick={() => resetFilters("cobrancas")}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-[12px] font-medium text-ink transition hover:opacity-95"
          >
            Ver cobranÃƒÂ§as <ArrowRight className="h-3.5 w-3.5" />
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
                  toast.success("SessÃƒÂ£o encerrada");
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
            <PageHeader active={active} onPrimary={() => handlePrimary(active, resetFilters)} />

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

            {active !== "dashboard" && active !== "configuracoes" && active !== "relatorios" && (
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
                      ? ["Celular", "PeÃƒÂ§a", "ServiÃƒÂ§o", "Combo"]
                      : []
                }
              />
            )}

            {active === "celulares" && (
              <ModuleCard
                title="Cadastro rÃƒÂ¡pido de celular"
                icon={Smartphone}
                action={<Button onClick={addPhone}>Cadastrar celular</Button>}
              >
                <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
                  <SelectLike
                    value={newPhone.modelo}
                    onChange={(value) => setNewPhone({ ...newPhone, modelo: value })}
                    options={iphoneModels}
                  />
                  <SelectLike
                    value={newPhone.capacidade}
                    onChange={(value) => setNewPhone({ ...newPhone, capacidade: value })}
                    options={["16GB", "32GB", "64GB", "128GB", "256GB", "512GB", "1TB", "2TB"]}
                  />
                  <Input
                    placeholder="Cor"
                    value={newPhone.cor}
                    onChange={(event) => setNewPhone({ ...newPhone, cor: event.target.value })}
                  />
                </div>
              </ModuleCard>
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
                    "AÃƒÂ§ÃƒÂµes",
                  ]}
                  rows={filteredPhones.map((phone) => [
                    <ItemTitle
                      key="modelo"
                      title={`${phone.modelo} ${phone.capacidade} ${phone.cor}`}
                      subtitle={`${phone.estado} Ã¢â‚¬Â¢ ${phone.bloqueio}`}
                    />,
                    phone.imei,
                    `${phone.bateria}%`,
                    `Face ID ${phone.faceId} Ã¢â‚¬Â¢ Tela ${phone.telaOriginal}`,
                    `${brl(phone.custoCompra + phone.custoManutencao)}`,
                    brl(phone.precoVenda),
                    <StatusPill key="status" status={phone.status} />,
                    <Actions key="actions" onDelete={() => removeById(setPhones, phone.id)} />,
                  ])}
                />
              </DataCard>
            )}

            {active === "pecas" && (
              <>
                <ModuleCard
                  title="Cadastro rÃƒÂ¡pido de peÃƒÂ§a"
                  icon={Package}
                  action={<Button onClick={addPart}>Cadastrar peÃƒÂ§a</Button>}
                >
                  <div className="grid gap-3 lg:grid-cols-[1fr_1fr_120px]">
                    <SelectLike
                      value={newPart.tipo}
                      onChange={(value) => setNewPart({ ...newPart, tipo: value })}
                      options={partTypes}
                    />
                    <SelectLike
                      value={newPart.modelo}
                      onChange={(value) => setNewPart({ ...newPart, modelo: value })}
                      options={iphoneModels}
                    />
                    <Input
                      type="number"
                      min={0}
                      placeholder="Qtd."
                      value={newPart.quantidade}
                      onChange={(event) =>
                        setNewPart({ ...newPart, quantidade: event.target.value })
                      }
                    />
                  </div>
                </ModuleCard>
                <GeneratedPartsPreview />
                <DataCard>
                  <ResponsiveTable
                    columns={[
                      "PeÃƒÂ§a",
                      "Qualidade",
                      "Fornecedor",
                      "PreÃƒÂ§o",
                      "Estoque",
                      "Garantia",
                      "Status",
                      "AÃƒÂ§ÃƒÂµes",
                    ]}
                    rows={filteredParts.map((part) => [
                      <ItemTitle
                        key="peca"
                        title={`${part.tipo} ${part.modelo}`}
                        subtitle={`${part.sku} Ã¢â‚¬Â¢ ${part.localizacao}`}
                      />,
                      part.qualidade,
                      part.fornecedor,
                      `${brl(part.preco)} / instalado ${brl(part.precoInstalado)}`,
                      `${part.quantidade} un. Ã¢â‚¬Â¢ mÃƒÂ­nimo ${part.minimo}`,
                      `${part.garantia} dias`,
                      <StockPill key="status" part={part} />,
                      <Actions key="actions" onDelete={() => removeById(setParts, part.id)} />,
                    ])}
                  />
                </DataCard>
              </>
            )}

            {active === "servicos" && (
              <>
                <ModuleCard
                  title="Nova ordem de serviÃƒÂ§o"
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
                      "ServiÃƒÂ§o",
                      "Valores",
                      "Prazo",
                      "Status",
                      "AÃƒÂ§ÃƒÂµes",
                    ]}
                    rows={filteredServices.map((service) => {
                      const total = service.custoPeca + service.maoObra;
                      return [
                        <ItemTitle
                          key="cliente"
                          title={service.cliente}
                          subtitle={service.whatsapp || "WhatsApp nÃƒÂ£o informado"}
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
                          subtitle={`PeÃƒÂ§a: ${service.peca || "A definir"}`}
                        />,
                        `${brl(total)} Ã¢â‚¬Â¢ entrada ${brl(service.entrada)}`,
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
              <DataCard>
                <ResponsiveTable
                  columns={[
                    "Cliente",
                    "HistÃƒÂ³rico",
                    "Compras",
                    "Total comprado",
                    "Em aberto",
                    "Status",
                    "AÃƒÂ§ÃƒÂµes",
                  ]}
                  rows={filteredClients.map((client) => [
                    <ItemTitle
                      key="cliente"
                      title={client.nome}
                      subtitle={`${client.whatsapp} Ã¢â‚¬Â¢ ${client.endereco || "Sem endereÃƒÂ§o"}`}
                    />,
                    `${client.aparelhos.join(", ") || "Sem aparelhos"} Ã¢â‚¬Â¢ ${client.servicos.join(", ") || "Sem serviÃƒÂ§os"}`,
                    String(client.compras),
                    brl(client.totalComprado),
                    brl(client.aberto),
                    <StatusPill key="status" status={client.status} />,
                    <Actions key="actions" onDelete={() => removeById(setClients, client.id)} />,
                  ])}
                />
              </DataCard>
            )}

            {active === "vendas" && (
              <>
                <ModuleCard
                  title="Nova venda"
                  icon={BadgeDollarSign}
                  action={<Button onClick={addSale}>Registrar venda</Button>}
                >
                  <div className="grid gap-3 lg:grid-cols-[1fr_150px_1fr_130px_130px_110px]">
                    <Input
                      placeholder="Cliente"
                      value={newSale.cliente}
                      onChange={(event) => setNewSale({ ...newSale, cliente: event.target.value })}
                    />
                    <SelectLike
                      value={newSale.tipo}
                      onChange={(value) => setNewSale({ ...newSale, tipo: value as Sale["tipo"] })}
                      options={["Celular", "PeÃƒÂ§a", "ServiÃƒÂ§o", "Combo"]}
                    />
                    <Input
                      placeholder="Produto/peÃƒÂ§a/serviÃƒÂ§o"
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
                </ModuleCard>
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
                      "AÃƒÂ§ÃƒÂµes",
                    ]}
                    rows={filteredSales.map((sale) => [
                      sale.cliente,
                      <ItemTitle
                        key="item"
                        title={sale.item}
                        subtitle={`${sale.tipo} Ã¢â‚¬Â¢ ${sale.quantidade} un.`}
                      />,
                      `${sale.pagamento} Ã¢â‚¬Â¢ ${sale.parcelas}x`,
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

            {active === "pagamentos" && (
              <DataCard>
                <ResponsiveTable
                  columns={[
                    "Cliente",
                    "Venda vinculada",
                    "Valor pago",
                    "Forma",
                    "Data",
                    "ObservaÃƒÂ§ÃƒÂµes",
                    "AÃƒÂ§ÃƒÂµes",
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
                    title="CobranÃƒÂ§as de hoje"
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
                    columns={[
                      "Cliente",
                      "ReferÃƒÂªncia",
                      "Vencimento",
                      "Valor",
                      "Status",
                      "AÃƒÂ§ÃƒÂµes",
                    ]}
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
                          onClick={() => markChargePaid(charge.id)}
                        />
                        <ActionButton
                          icon={PenLine}
                          label="Renegociar"
                          onClick={() => toast.success("RenegociaÃƒÂ§ÃƒÂ£o anotada")}
                        />
                      </div>,
                    ])}
                  />
                </DataCard>
              </>
            )}

            {active === "estoque" && <StockView phones={phones} parts={parts} totals={totals} />}
            {active === "relatorios" && (
              <ReportsView
                sales={sales}
                parts={parts}
                clients={clients}
                services={services}
                totals={totals}
              />
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
  const categoryTotals = ["Celular", "PeÃƒÂ§a", "ServiÃƒÂ§o"].map((category) => ({
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
          title="Total vendido no mÃƒÂªs"
          value={brl(totals.totalVendido)}
          subtitle="Celulares, peÃƒÂ§as e serviÃƒÂ§os"
          icon={BadgeDollarSign}
        />
        <MetricCard
          title="Total recebido no mÃƒÂªs"
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
          title="Lucro estimado do mÃƒÂªs"
          value={brl(totals.lucro)}
          subtitle="Margem prevista"
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniMetric
          title="PeÃƒÂ§as com estoque baixo"
          value={String(totals.lowStock.length)}
          icon={Package}
          tone="warning"
        />
        <MiniMetric
          title="ServiÃƒÂ§os em andamento"
          value={String(totals.activeServices.length)}
          icon={Wrench}
        />
        <MiniMetric
          title="Aparelhos disponÃƒÂ­veis"
          value={String(totals.availablePhones)}
          icon={Smartphone}
        />
        <MiniMetric title="Clientes em aberto" value={String(totals.openClients)} icon={Users} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <DataCard title="Receita x Fiado dos ÃƒÂºltimos 5 meses">
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
        <DataCard title="PeÃƒÂ§as mais vendidas">
          <RankList items={[]} />
        </DataCard>
        <DataCard title="Modelos de iPhone mais vendidos">
          <RankList items={[]} />
        </DataCard>
        <DataCard title="CobranÃƒÂ§as pendentes por cliente">
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
        <DataCard title="ServiÃƒÂ§os ativos">
          <ResponsiveTable
            columns={["Cliente", "Modelo", "ServiÃƒÂ§o", "Status"]}
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
}: {
  phones: Phone[];
  parts: Part[];
  totals: ReturnType<typeof computeTotalsShape>;
}) {
  const accessoryStock = parts.filter((item) =>
    ["PelÃƒÂ­cula", "Capinha", "Cabo", "Carregador"].includes(item.tipo),
  );
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
          title="Estoque de peÃƒÂ§as"
          value={String(parts.reduce((acc, item) => acc + item.quantidade, 0))}
          subtitle="Unidades disponÃƒÂ­veis"
          icon={Package}
        />
        <MetricCard
          title="AcessÃƒÂ³rios"
          value={String(accessoryStock.reduce((acc, item) => acc + item.quantidade, 0))}
          subtitle="Capinhas, cabos e pelÃƒÂ­culas"
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
      <DataCard title="MovimentaÃƒÂ§ÃƒÂ£o e alertas">
        <ResponsiveTable
          columns={["Tipo", "Item", "Estoque", "Local", "Status"]}
          rows={parts.map((part) => [
            part.tipo,
            `${part.tipo} ${part.modelo}`,
            `${part.quantidade} un.`,
            part.localizacao,
            <StockPill key="status" part={part} />,
          ])}
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
      "Celulares, peÃƒÂ§as e serviÃƒÂ§os",
    ],
    ["Vendas por modelo de iPhone", "iPhone 13, iPhone 11, iPhone 14 Pro Max", "Top modelos"],
    ["PeÃƒÂ§as mais vendidas", "Bateria, Tela, PelÃƒÂ­cula", "Ranking operacional"],
    [
      "ServiÃƒÂ§os mais feitos",
      services.map((service) => service.servico).join(", "),
      "AssistÃƒÂªncia tÃƒÂ©cnica",
    ],
    ["Clientes que mais compram", clients.map((client) => client.nome).join(", "), "Base ativa"],
    [
      "Clientes inadimplentes",
      clients
        .filter((client) => client.aberto > 0)
        .map((client) => client.nome)
        .join(", "),
      "CobranÃƒÂ§a",
    ],
    [
      "Estoque baixo",
      parts
        .filter((part) => part.quantidade <= part.minimo)
        .map((part) => part.tipo)
        .join(", "),
      "ReposiÃƒÂ§ÃƒÂ£o",
    ],
    ["Margem por produto", brl(totals.lucroPotencial), "Potencial de estoque"],
    ["Total fiado", brl(totals.totalFiado), "Em aberto"],
    ["Total recebido", brl(totals.totalRecebido), "Pagamentos"],
  ];

  return (
    <DataCard title="RelatÃƒÂ³rios da loja de iPhone">
      <ResponsiveTable columns={["RelatÃƒÂ³rio", "Valor/Resumo", "Uso"]} rows={reportRows} />
    </DataCard>
  );
}

function SettingsView() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
      <DataCard title="ConfiguraÃƒÂ§ÃƒÂµes da V2">
        <div className="grid gap-4">
          <Field label="Nome da loja" value="Fiado iPhones" />
          <Field label="WhatsApp padrÃƒÂ£o de cobranÃƒÂ§a" value="(11) 99999-0000" />
          <Field label="Garantia padrÃƒÂ£o de serviÃƒÂ§os" value="90 dias" />
          <Field label="Estoque mÃƒÂ­nimo padrÃƒÂ£o" value="2 unidades" />
          <Textarea
            className="min-h-[120px] rounded-2xl bg-surface"
            defaultValue="OlÃƒÂ¡, [nome]. Tudo bem? Passando para lembrar que ficou um valor em aberto de R$ [valor] referente ÃƒÂ  sua compra/serviÃƒÂ§o na loja. O vencimento ÃƒÂ© [data]. Pode me confirmar quando consegue realizar o pagamento?"
          />
          <Button onClick={() => toast.success("ConfiguraÃƒÂ§ÃƒÂµes salvas")}>
            Salvar configuraÃƒÂ§ÃƒÂµes
          </Button>
        </div>
      </DataCard>
      <DataCard title="Regras automÃƒÂ¡ticas">
        <div className="grid gap-3 text-sm">
          {[
            "Baixar estoque automaticamente ao vender peÃƒÂ§a ou celular.",
            "Calcular lucro por aparelho, peÃƒÂ§a e serviÃƒÂ§o.",
            "Gerar cobranÃƒÂ§a para vendas fiadas e entrada + parcelas.",
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

function PageHeader({ active, onPrimary }: { active: TabId; onPrimary: () => void }) {
  const title = tabs.find((item) => item.id === active)?.label ?? "Dashboard";
  const copy: Record<TabId, string> = {
    dashboard: "VisÃƒÂ£o completa da loja: vendas, assistÃƒÂªncia, estoque, lucro e cobranÃƒÂ§as.",
    celulares:
      "Cadastre iPhones com IMEI, bateria, origem, custos, acessÃƒÂ³rios e status de venda.",
    pecas: "Controle peÃƒÂ§as por modelo, qualidade, fornecedor, preÃƒÂ§o, garantia e estoque.",
    servicos:
      "Ordens de serviÃƒÂ§o com diagnÃƒÂ³stico, peÃƒÂ§a usada, mÃƒÂ£o de obra, prazo e garantia.",
    clientes: "HistÃƒÂ³rico de aparelhos, serviÃƒÂ§os, peÃƒÂ§as compradas e valores em aberto.",
    vendas:
      "Venda celular, peÃƒÂ§a, serviÃƒÂ§o ou combo com baixa de estoque e cÃƒÂ¡lculo de lucro.",
    pagamentos: "Entradas e pagamentos vinculados a vendas, clientes e comprovantes.",
    cobrancas: "CobranÃƒÂ§as de hoje, vencidas e prÃƒÂ³ximas com mensagem pronta para WhatsApp.",
    estoque:
      "VisÃƒÂ£o de aparelhos, peÃƒÂ§as, acessÃƒÂ³rios, movimentaÃƒÂ§ÃƒÂ£o e lucro potencial.",
    relatorios:
      "Faturamento, margem, ranking de peÃƒÂ§as, modelos, serviÃƒÂ§os e inadimplÃƒÂªncia.",
    configuracoes: "PreferÃƒÂªncias da V2 para loja de iPhones e assistÃƒÂªncia tÃƒÂ©cnica.",
  };
  const button: Partial<Record<TabId, string>> = {
    celulares: "+ Novo celular",
    pecas: "+ Nova peÃƒÂ§a",
    servicos: "+ Novo serviÃƒÂ§o",
    vendas: "+ Nova venda",
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
          placeholder="Buscar por nome, modelo, IMEI, cliente, peÃƒÂ§a, status ou valor"
        />
      </div>
      <SelectLike
        value={status}
        onChange={onStatus}
        options={[
          "Todos",
          "DisponÃƒÂ­vel",
          "Baixo estoque",
          "Sem estoque",
          "Vendido",
          "Reservado",
          "Em manutenÃƒÂ§ÃƒÂ£o",
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
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: typeof LayoutGrid;
  action: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 rounded-[24px] bg-surface p-4 shadow-soft">
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
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 min-w-0 rounded-full border border-border bg-surface-muted px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
    >
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
  const tone = ["Pago", "DisponÃƒÂ­vel", "Entregue", "VIP", "Ativo"].includes(status)
    ? "bg-success/10 text-success"
    : ["Atrasado", "Inadimplente", "Bloqueado", "Sem estoque", "Cancelado"].includes(status)
      ? "bg-destructive/10 text-destructive"
      : ["Baixo estoque", "Aguardando peÃƒÂ§a", "Reservado", "Parcial"].includes(status)
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
      <ActionButton
        icon={Eye}
        label="Ver"
        onClick={() => toast.success("VisualizaÃƒÂ§ÃƒÂ£o aberta")}
      />
      <ActionButton
        icon={PenLine}
        label="Editar"
        onClick={() => toast.success("EdiÃƒÂ§ÃƒÂ£o pronta para conectar")}
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
    "CÃƒÂ¢mera traseira",
    "Flex de carga",
    "PelÃƒÂ­cula",
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
          CombinaÃƒÂ§ÃƒÂµes automÃƒÂ¡ticas por modelo
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

function handlePrimary(active: TabId, resetFilters: (tab: TabId) => void) {
  resetFilters(active);
  toast.success(
    active === "celulares"
      ? "Use o cadastro rÃƒÂ¡pido de celular"
      : active === "pecas"
        ? "Use o cadastro rÃƒÂ¡pido de peÃƒÂ§a"
        : active === "servicos"
          ? "Use a nova ordem de serviÃƒÂ§o"
          : "Use o cadastro de venda",
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
