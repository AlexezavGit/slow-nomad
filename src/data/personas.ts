export interface Persona {
  id: string;
  num: number;
  icon: string;
  name: string;
  tagline: string;
  horizon: string;
  accentColor: string;
  desc: string;
  statusTrigger: string;
  discount: string;
  notification: string;
  journey: string[];
  crossesTo: string[];
  // Achievement thresholds for auto-assignment
  minRoutes?: number;
  minPlaces?: number;
  minSlots?: number;
  minCheckins?: number;
}

export const PERSONAS: Persona[] = [
  {
    id: 'pointer',
    num: 1,
    icon: '→',
    name: 'Pointer',
    tagline: 'Тільки увійшов — пробує все',
    horizon: 'Короткі зупинки, всі напрямки',
    accentColor: '#0C7EAF',
    desc: 'Тільки ввійшов. Пробує всі сервіси і всі напрямки. Крос-букінг — основний інструмент щоб знайти свої місця і своє комʼюніті. Ще не визначився, але вже всередині.',
    statusTrigger: 'Перша реєстрація + перший check-in',
    discount: '5% на перше бронювання',
    notification: 'Ти всередині. Перший крок зроблено — тепер шукай своє місце.',
    journey: ['Реєстрація і перший check-in', 'Крос-букінг між локаціями', 'Пошук свого місця і спільноти'],
    crossesTo: ['Scout', 'Host', 'Dreamer'],
    minCheckins: 0,
  },
  {
    id: 'scout',
    num: 2,
    icon: '◎',
    name: 'Scout',
    tagline: 'Мандрівник — знаходить нові місця',
    horizon: '2–6 місяців на місці',
    accentColor: '#0C7EAF',
    desc: 'Активний дослідник нових місць. Знаходить локації, тестує спільноти, розробляє маршрути між ними. Його карта постійно росте. Головний актив — нові місця і маршрути що він додає до мережі.',
    statusTrigger: '3+ check-in в різних локаціях + 1+ маршрут',
    discount: '7% на бронювання + приоритет у нових локаціях',
    notification: 'Статус Scout. Три місця — ти вже орієнтований. Твій перший маршрут на карті.',
    journey: ['3+ check-in в різних локаціях', 'Додати перший маршрут', 'Знайти 2+ нових місця для мережі'],
    crossesTo: ['Nomad', 'Freediver'],
    minCheckins: 3,
    minRoutes: 1,
  },
  {
    id: 'nomad',
    num: 3,
    icon: '⟳',
    name: 'Nomad',
    tagline: 'Справжній — живе між місцями',
    horizon: 'Постійний рух, 4–8 локацій/рік',
    accentColor: '#0C7EAF',
    desc: 'Справжній номад. Живе між локаціями, знає мережу зсередини. Активний учасник комʼюніті кожного місця де буває. Його думка важлива при відборі нових обʼєктів.',
    statusTrigger: '8+ check-in в 3+ локаціях + 3+ маршрути',
    discount: '8% скрізь + голос у відборі нових обʼєктів',
    notification: 'Статус Nomad. Вісім місць, три маршрути. Тепер твій голос рахується.',
    journey: ['8+ check-in в 3+ локаціях', '3+ розроблених маршрути', 'Участь у відборі нового обʼєкту'],
    crossesTo: ['Freediver', 'Host', 'Collector'],
    minCheckins: 8,
    minRoutes: 3,
  },
  {
    id: 'host',
    num: 4,
    icon: '⌂',
    name: 'Host',
    tagline: 'Даунshift — приймає і відпочиває',
    horizon: '6 міс — 2 роки на одному місці',
    accentColor: '#4A4A4A',
    desc: 'Втомився — зробив даунshift. Але прекрасно приймає гостей і може відпочити. А коли знову захоче — відправиться в шлях. Почесна посада: стоїть в основі досвіду для всіх хто приїжджає. Зарплата з платформного пулу.',
    statusTrigger: '10+ check-in + стажування + інтервʼю з комʼюніті обʼєкту',
    discount: 'Безкоштовне проживання на обʼєкті + дисконт 15% в інших локаціях',
    notification: 'Статус Host. Тепер у тебе є місце і дохід. Комʼюніті чекає на тебе.',
    journey: ['10+ check-in в мережі', 'Стажування 1–3 місяці на діючому обʼєкті', 'Заявка + інтервʼю з комʼюніті', 'Host статус → зарплата + дисконт скрізь'],
    crossesTo: ['Freediver'],
    minCheckins: 10,
  },
  {
    id: 'freediver',
    num: 5,
    icon: '≋',
    name: 'Freediver',
    tagline: 'Будує мережу місць на все життя',
    horizon: '10–30 років',
    accentColor: '#0C7EAF',
    desc: 'Активно будує мережу своїх місць поки подорожує молодим. Продовжує вкладати коли є гроші. Коли вирішує не працювати — витрачає менше на життя, або заробляє як рантьє, або осідає в якомусь місці хранителем стандартів.',
    statusTrigger: '3+ частки в 2+ регіонах',
    discount: '12% скрізь + пріоритет у черзі нових обʼєктів',
    notification: 'Статус Freediver. Три місця — твоя мережа починається. Дисконт 12% тепер діє в усіх локаціях.',
    journey: ['Перша частка 1/4 (~$15–35k)', 'Щороку нова частка в новому регіоні', '8+ часток = фінансова свобода', 'Осів → стає Host або Guardian за вибором'],
    crossesTo: ['Host', 'Collector'],
    minSlots: 3,
  },
  {
    id: 'collector',
    num: 6,
    icon: '◈',
    name: 'Collector',
    tagline: 'Збирає місця — впевнено і системно',
    horizon: 'Постійна активність, P2P ринок',
    accentColor: '#5A2A8A',
    desc: 'Збирає місця. Впевнено. Купує. Він збирач — і це стиль мислення, а не лише фінансова стратегія. Активний гравець внутрішнього P2P ринку часток. Портфель росте, географія розширюється.',
    statusTrigger: '5+ часток в 3+ різних обʼєктах',
    discount: '10% на придбання нових часток + пріоритет доступу до нових обʼєктів',
    notification: 'Статус Collector. Пʼять місць у портфелі. Тепер ти формуєш географію мережі.',
    journey: ['Аналіз yield і потенціалу нових обʼєктів', 'Купівля через P2P marketplace', 'Тримає 6–18 місяців поки обʼєкт зростає', 'Реінвестує або розширює географію'],
    crossesTo: ['Frontrunner', 'Sower'],
    minSlots: 5,
  },
  {
    id: 'admirer',
    num: 7,
    icon: '⊙',
    name: 'Admirer',
    tagline: 'Готельєр — повертається на шлях номада',
    horizon: 'Один раз назавжди',
    accentColor: '#C8951A',
    desc: 'Готельєр, який вирішив продати свій стаціонарний обʼєкт і повернутися на шлях номада. Може обміняти готель на кілька місць. Скинути з себе менеджмент і знову стати номадом — або просто вийти в кеш.',
    statusTrigger: 'Рішення комʼюніті після due diligence обʼєкту',
    discount: 'Дисконт = % поступки на угоді (назавжди, по всіх локаціях)',
    notification: 'Ласкаво просимо. Комʼюніті прийняло тебе. Твоя кімната тебе чекає.',
    journey: ['Подає обʼєкт на розгляд комʼюніті', 'Due diligence: стан, локація, потенціал', 'Голосування — умови обміну або входу', 'Прийнятий → кімната назавжди + прихований дисконт'],
    crossesTo: ['Freediver', 'Host'],
  },
  {
    id: 'dreamer',
    num: 8,
    icon: '◌',
    name: 'Dreamer',
    tagline: 'Приїхав з кимось — і може залишитися',
    horizon: '1 рік на роздуми',
    accentColor: '#8A3A2A',
    desc: 'Затесався — приїхав з кимось. Ще нічого не купив, але так сподобалось, що комʼюніті хотіло б його не відпустити. Тому отримує право орендувати зі знижкою від людини, яка його рекомендувала. Може думати 1 рік.',
    statusTrigger: 'Рекомендація діючого учасника + перший візит',
    discount: 'Оренда зі знижкою (розмір = знижка рекомендатора) на 1 рік',
    notification: 'Ти гість з рекомендацією. Рік у тебе є — думай, пробуй, вирішуй.',
    journey: ['Приїхав з учасником мережі', 'Комʼюніті вирішує: варто тримати контакт', 'Отримує дисконт на оренду від рекомендатора', 'Через 1 рік: входить як Pointer або виходить'],
    crossesTo: ['Pointer', 'Admirer'],
  },
  {
    id: 'sower',
    num: 9,
    icon: '✦',
    name: 'Sower',
    tagline: 'Рідко їздить — багато вкладає',
    horizon: 'Довгостроковий інвестор',
    accentColor: '#1A6A5A',
    desc: 'Рідко їздить, але багато витрачає на придбання. Сіє ресурси — звідси назва. Чистий інвестор, який системно вкладається в мережу. Не номад за способом життя, але без нього мережа не росте.',
    statusTrigger: '3+ частки з мінімальним особистим використанням (< 15 ночей/рік)',
    discount: '15% на придбання нових часток + пріоритетний доступ до нових пулів',
    notification: 'Статус Sower. Мережа росте завдяки тобі. Пріоритет на нові пули відкрито.',
    journey: ['Аналізує yield і географію', 'Купує частки — переважно нові або недооцінені', 'Рідко використовує особисто — отримує дохід', 'Реінвестує дохід у нові обʼєкти'],
    crossesTo: ['Collector', 'Frontrunner'],
    minSlots: 3,
  },
];

// Auto-assign persona based on user activity
export function assignPersona(stats: {
  checkins: number;
  routes: number;
  places: number;
  slots: number;
  isHostCandidate?: boolean;
  isDreamer?: boolean;
  isAdmirer?: boolean;
}): Persona {
  if (stats.isDreamer) return PERSONAS.find(p => p.id === 'dreamer')!;
  if (stats.isAdmirer) return PERSONAS.find(p => p.id === 'admirer')!;
  if (stats.isHostCandidate && stats.checkins >= 10) return PERSONAS.find(p => p.id === 'host')!;
  if (stats.slots >= 5) return PERSONAS.find(p => p.id === 'collector')!;
  if (stats.slots >= 3) {
    if (stats.checkins < 15) return PERSONAS.find(p => p.id === 'sower')!;
    return PERSONAS.find(p => p.id === 'freediver')!;
  }
  if (stats.checkins >= 8 && stats.routes >= 3) return PERSONAS.find(p => p.id === 'nomad')!;
  if (stats.checkins >= 3 && stats.routes >= 1) return PERSONAS.find(p => p.id === 'scout')!;
  return PERSONAS.find(p => p.id === 'pointer')!;
}
