export interface AIResponse {
  empathy: string;
  alternatives: string[];
  insight: string;
  tip: string;
}

function detectKeywords(text: string): string[] {
  const keywords: string[] = [];
  if (/宿題|勉強|学校|テスト/.test(text)) keywords.push("勉強");
  if (/食べ|ご飯|食事|野菜/.test(text)) keywords.push("食事");
  if (/片付け|散らかし|部屋|おもちゃ/.test(text)) keywords.push("片付け");
  if (/兄弟|姉妹|けんか|喧嘩/.test(text)) keywords.push("兄弟げんか");
  if (/ゲーム|スマホ|動画|YouTube/.test(text)) keywords.push("画面");
  if (/言うこと|聞かない|無視|ぐずる/.test(text)) keywords.push("言うことを聞かない");
  if (/泣く|泣いて|わがまま|ぐずり/.test(text)) keywords.push("ぐずり");
  if (/朝|起き|遅刻|準備/.test(text)) keywords.push("朝の準備");
  return keywords;
}

const empathyTemplates = [
  "それは本当に辛かったと思います。疲れていたり、余裕がなかったときに限って、こういうことが起きてしまうんですよね。自分を責めすぎないでください。",
  "気持ちが爆発してしまう瞬間って、誰にでもあります。あなたが振り返って「ミスったな」と思えること自体、すごく大切な感覚です。",
  "あなたの怒りの裏には、子どもへの愛情や期待があったんだと思います。うまくいかなくて、もどかしかったんですよね。",
  "完璧な親なんていません。こうして振り返ろうとしているあなたは、すでに十分いい親です。",
];

function buildAlternatives(keywords: string[]): string[] {
  const base: Record<string, string[]> = {
    勉強: [
      "「宿題、難しい問題はあった？一緒に見ようか」",
      "「今日は疲れてるかな。ちょっと休んでからにしよう」",
      "「どこまでやったか、見せてくれる？」",
    ],
    食事: [
      "「ひと口だけ食べてみて、合わなかったら無理しなくていいよ」",
      "「食べられるもの、一緒に選んでみようか」",
      "「お腹すいてない？少しだけ食べてみて」",
    ],
    片付け: [
      "「一緒に片付けよう。5分だけやってみようか」",
      "「どこに入れたらいいか、ちょっと教えてあげようか」",
      "「まず、そこにあるものだけ片付けようか」",
    ],
    兄弟げんか: [
      "「何があったか、順番に話してくれる？」",
      "「お互いに言いたいことがあるよね。まず聞かせて」",
      "「どんな気持ちだったか、教えてくれる？」",
    ],
    画面: [
      "「あと10分したら終わりにしようか。タイマーセットしようね」",
      "「今どんなゲームしてるの？ちょっと見せて」",
      "「終わったら、一緒に何かしようか」",
    ],
    朝の準備: [
      "「今日は何が難しかった？一緒に考えよう」",
      "「昨日のうちに準備するの、一緒にやってみようか」",
      "「何か手伝えることある？」",
    ],
  };

  const defaults = [
    "「今、どんな気持ちか教えてくれる？」",
    "「ちょっと落ち着いてから、もう一回話そう」",
    "「あなたのことが大切だから、心配しているんだよ」",
    "「どうしたかったか、教えてくれる？」",
  ];

  for (const kw of keywords) {
    if (base[kw]) return base[kw];
  }
  return defaults;
}

const insightTemplates = [
  "怒りの多くは「こうあってほしい」という期待からきています。その期待は愛情の裏返しです。",
  "子どもの行動に強く反応するとき、自分自身も何か疲れていたり、余裕がなかったりすることが多いです。",
  "感情が爆発した後に後悔するのは、あなたが子どもとの関係を大切にしている証拠です。",
  "子どもは親の感情を敏感に察知します。「言い方」より「気持ちが落ち着いていること」の方が伝わりやすいことがあります。",
];

const tipTemplates = [
  "もし機会があれば、落ち着いたタイミングで「さっきは強く言ってごめんね」と一言伝えてみてください。子どもは意外とちゃんと受け取ってくれます。",
  "次に同じ場面が来たとき、まず深呼吸を3回してみてください。それだけで言葉が変わることがあります。",
  "今日は自分を労ってください。頑張っている自分を認めてあげることも、親として大切なことです。",
  "「ミスった」と気づいたあなたはすでに次のステップにいます。焦らず、少しずつでいいです。",
];

let callCount = 0;

export function getMockResponse(userText: string): AIResponse {
  const keywords = detectKeywords(userText);
  const idx = callCount++ % empathyTemplates.length;

  return {
    empathy: empathyTemplates[idx],
    alternatives: buildAlternatives(keywords),
    insight: insightTemplates[idx],
    tip: tipTemplates[idx],
  };
}
