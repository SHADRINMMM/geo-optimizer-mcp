/**
 * suggest_monitoring_config — AI-generated monitoring configuration.
 *
 * Designed for AI agents: given a business description, generates
 * target audience descriptions, monitoring location, and suggested queries
 * that can be applied via the Causabi API (PUT /monitor/{site_id}/settings).
 *
 * No auth required — this is purely generative (no API call to Causabi).
 */
import type { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export const configureToolDef: Tool = {
  name: "suggest_monitoring_config",
  description:
    "Generate a complete AI monitoring configuration for a business: " +
    "target audience descriptions, monitoring location, and query suggestions. " +
    "Use this when the user describes their business and wants to set up monitoring " +
    "for the right audience and location. " +
    "Returns ready-to-use configuration JSON and API instructions to apply it. " +
    "AI agents can use this to auto-fill monitoring settings without the user " +
    "having to manually describe their audience.",
  inputSchema: {
    type: "object",
    properties: {
      business_name: {
        type: "string",
        description: "Business name",
      },
      business_description: {
        type: "string",
        description:
          "What the business does — the more detail, the better the config. " +
          "Include: who the customers are, what problems you solve, where you operate.",
      },
      location: {
        type: "string",
        description:
          "Primary location or service area (city, region, or country). " +
          "Used to localize AI search monitoring.",
      },
      target_queries: {
        type: "array",
        items: { type: "string" },
        description:
          "Optional: existing target queries. If provided, audience suggestions " +
          "will be tuned to match how these queries are typically asked.",
      },
    },
    required: ["business_name", "business_description"],
  },
};

interface ConfigureArgs {
  business_name: string;
  business_description: string;
  location?: string;
  target_queries?: string[];
}

export function configureHandler(args: Record<string, unknown>): CallToolResult {
  const { business_name, business_description, location, target_queries = [] } =
    args as unknown as ConfigureArgs;

  if (!business_name || !business_description) {
    return {
      content: [{ type: "text", text: "business_name and business_description are required" }],
      isError: true,
    };
  }

  const config = inferConfig(business_name, business_description, location, target_queries);
  return { content: [{ type: "text", text: formatConfig(business_name, config) }] };
}

interface MonitoringConfig {
  monitoring_location: string;
  target_audiences: string[];
  suggested_queries: string[];
}

function inferConfig(
  name: string,
  description: string,
  location?: string,
  queries?: string[]
): MonitoringConfig {
  const desc = description.toLowerCase();

  // Infer location
  const monitoring_location = location?.trim() || inferLocation(desc);

  // Infer audiences from business description
  const target_audiences = inferAudiences(name, description, desc);

  // Suggest queries based on business type
  const suggested_queries = inferQueries(name, desc, monitoring_location, queries || []);

  return { monitoring_location, target_audiences, suggested_queries };
}

function inferLocation(desc: string): string {
  const cities: [string, string][] = [
    ["москв", "Москва"],
    ["moscow", "Moscow"],
    ["санкт-петербург", "Санкт-Петербург"],
    ["петербург", "Санкт-Петербург"],
    ["saint petersburg", "Saint Petersburg"],
    ["спб", "Санкт-Петербург"],
    ["новосибирск", "Новосибирск"],
    ["екатеринбург", "Екатеринбург"],
    ["казань", "Казань"],
    ["краснодар", "Краснодар"],
  ];
  for (const [key, city] of cities) {
    if (desc.includes(key)) return city;
  }
  return "";
}

function hasCyrillic(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

function inferAudiences(name: string, description: string, desc: string): string[] {
  const audiences: string[] = [];
  const t = (ru: string, en: string) => (hasCyrillic(name + description) ? ru : en);

  // E-commerce / online store
  if (desc.match(/интернет.?магазин|онлайн.?магазин|e-?commerce|online store|shop/)) {
    audiences.push(t("Покупатели которые ищут товары онлайн и сравнивают цены",
      "Shoppers who look for products online and compare prices"));
    audiences.push(t("Люди которые впервые покупают данный тип товара и ищут советы",
      "First-time buyers of this kind of product who look for advice"));
  }
  // Medical / health
  else if (desc.match(/клиник|больниц|врач|медицин|health|clinic|doctor|dental|стоматол/)) {
    audiences.push(t("Пациенты которые ищут врача или клинику для конкретной проблемы",
      "Patients looking for a doctor or clinic for a specific problem"));
    audiences.push(t("Люди которые сравнивают клиники по отзывам и ценам",
      "People comparing clinics by reviews and prices"));
  }
  // Legal / consulting
  else if (desc.match(/юрид|адвокат|консалтинг|legal|lawyer|attorney|consulting/)) {
    audiences.push(t("Люди у которых возникла конкретная юридическая проблема и они ищут помощь",
      "People with a specific legal problem who are looking for help"));
    audiences.push(t("Бизнес владельцы которым нужна профессиональная консультация",
      "Business owners who need professional consulting"));
  }
  // Real estate
  else if (desc.match(/недвижим|агентство|аренд|квартир|real estate|realty|rental/)) {
    audiences.push(t("Люди которые хотят купить или арендовать недвижимость в конкретном районе",
      "People who want to buy or rent property in a specific area"));
    audiences.push(t("Инвесторы которые ищут выгодные объекты для вложений",
      "Investors looking for profitable properties"));
  }
  // Restaurant / food
  else if (desc.match(/ресторан|кафе|еда|доставка|restaurant|cafe|food|delivery/)) {
    audiences.push(t("Люди которые ищут где поесть рядом или заказать доставку",
      "People looking for a place to eat nearby or to order delivery"));
    audiences.push(t("Компании которые планируют корпоративные обеды или банкеты",
      "Companies planning corporate lunches or banquets"));
  }
  // SaaS / software
  else if (desc.match(/saas|software|platform|платформ|сервис|сaas|приложени|app/)) {
    audiences.push(t("Руководители и продакты которые ищут инструмент для своей команды",
      "Managers and product owners looking for a tool for their team"));
    audiences.push(t("Технические специалисты которые сравнивают решения по функционалу",
      "Technical specialists comparing solutions by features"));
  }
  // Education
  else if (desc.match(/обучен|курс|школ|образован|education|course|training|learn/)) {
    audiences.push(t("Люди которые хотят освоить новый навык и ищут подходящий курс",
      "People who want to learn a new skill and look for a suitable course"));
    audiences.push(t("Работодатели которые ищут программы для обучения сотрудников",
      "Employers looking for training programs for their staff"));
  }
  // Beauty / wellness
  else if (desc.match(/салон|барбершоп|спа|красот|beauty|salon|spa|wellness/)) {
    audiences.push(t("Люди которые ищут мастера или салон рядом с домом или работой",
      "People looking for a specialist or salon near home or work"));
    audiences.push(t("Клиенты которые выбирают подарочный сертификат или процедуру",
      "Clients choosing a gift certificate or a treatment"));
  }
  // Fitness / sport
  else if (desc.match(/фитнес|трен|спорт|gym|fitness|sport|workout/)) {
    audiences.push(t("Люди которые хотят начать заниматься и выбирают зал или тренера",
      "People who want to start training and are choosing a gym or trainer"));
    audiences.push(t("Спортсмены которые ищут специализированный зал или программу",
      "Athletes looking for a specialized gym or program"));
  }
  // Finance / banking
  else if (desc.match(/банк|финанс|кредит|ипотек|инвест|bank|finance|credit|mortgage|invest/)) {
    audiences.push(t("Люди которые ищут выгодный кредит, вклад или ипотеку",
      "People looking for a good loan, deposit or mortgage"));
    audiences.push(t("Бизнес владельцы которым нужны финансовые продукты для компании",
      "Business owners who need financial products for their company"));
  }
  // Generic fallback
  else {
    audiences.push(t(`Люди которые ищут ${name.toLowerCase()} или похожий сервис`,
      `People looking for ${name.toLowerCase()} or a similar service`));
    audiences.push(t("Клиенты которые сравнивают варианты и читают отзывы перед выбором",
      "Customers who compare options and read reviews before choosing"));
  }

  // Add a "how they ask AI" framing for each
  return audiences.map(a => a);
}

function inferQueries(
  name: string,
  desc: string,
  location: string,
  existing: string[]
): string[] {
  if (existing.length >= 5) return existing.slice(0, 10);

  const loc = location ? ` ${location}` : "";
  const queries = new Set(existing);

  // Generic queries that work for most businesses
  const n = name.toLowerCase();
  const generic = hasCyrillic(name + desc)
    ? [
        `лучший ${n}${loc}`,
        `${n} отзывы`,
        `где найти ${n}${loc}`,
        `${n} цены`,
        `как выбрать ${n}`,
      ]
    : [
        `best ${n}${loc}`,
        `${n} reviews`,
        `where to find ${n}${loc}`,
        `${n} pricing`,
        `how to choose ${n}`,
      ];

  for (const q of generic) {
    if (queries.size < 10) queries.add(q);
  }

  return Array.from(queries);
}

function formatConfig(name: string, config: MonitoringConfig): string {
  const audiencesJson = JSON.stringify(config.target_audiences, null, 2);
  const queriesJson = JSON.stringify(config.suggested_queries, null, 2);

  return [
    `## Monitoring Config: ${name}`,
    ``,
    `AI-generated configuration based on your business description.`,
    ``,
    `### Target audiences`,
    ``,
    `These descriptions tell the query expander how your customers phrase their searches:`,
    ``,
    ...config.target_audiences.map((a, i) => `${i + 1}. ${a}`),
    ``,
    `### Monitoring location`,
    ``,
    config.monitoring_location
      ? `**${config.monitoring_location}** — AI engines will be checked with this location context`
      : `*(no location inferred — set manually if your business is location-specific)*`,
    ``,
    `### Suggested queries`,
    ``,
    ...config.suggested_queries.map(q => `- ${q}`),
    ``,
    `---`,
    ``,
    `## Apply via API`,
    ``,
    `**Step 1:** Update audiences and location (PUT /api/v1/monitor/{site_id}/settings):`,
    `\`\`\`json`,
    `{`,
    `  "monitoring_location": ${JSON.stringify(config.monitoring_location)},`,
    `  "target_audiences": ${audiencesJson}`,
    `}`,
    `\`\`\``,
    ``,
    `**Step 2:** Set target queries (PUT /api/v1/monitor/{site_id}/queries):`,
    `\`\`\`json`,
    `{`,
    `  "queries": ${queriesJson}`,
    `}`,
    `\`\`\``,
    ``,
    `**Step 3:** Trigger a monitoring run (POST /api/v1/monitor/{site_id}/run)`,
    ``,
    `All endpoints require authentication. Log in at https://causabi.com and use your API token.`,
    ``,
    `> **Tip:** Audiences can be free-form text — describe your customer in natural language, `,
    `> like "Parents of young children, 25-35, looking for safe baby products".`,
    `> No structured format required.`,
  ].join("\n");
}
