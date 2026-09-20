"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WORD_WOLF_PAIRS = exports.TALK_TOPICS = void 0;
exports.getRandomTopic = getRandomTopic;
exports.getRandomWordWolfPair = getRandomWordWolfPair;
// 雑談ゲーム用のお題デッキ
exports.TALK_TOPICS = [
    "最近買って一番良かったもの・後悔したものは？",
    "もし宝くじで3億円当たったら、明日何をする？",
    "人生で一番恥ずかしかった珍エピソードを教えて！",
    "今まで食べた中で最高に美味しかった食べ物は？",
    "他人に理解されないけど実は大好きなマニアックなこと",
    "もし1つだけ特殊能力を手に入れられるなら何がいい？",
    "無人島に1つだけ持っていけるなら何を持っていく？",
    "最近あった「地味にテンションが上がった瞬間」は？",
    "10年前の自分に1言だけアドバイスできるとしたら？",
    "自分の性格を一言で表すと何？その理由は？",
    "子どもの頃に信じ込んでいた勘違い・嘘エピソード",
    "実は苦手・どうしても無理な食べ物やシチュエーション",
    "休みの日はアウトドア派？インドア派？理想の休日は？",
    "もし明日地球が滅亡するなら最後の晩餐は何を食べる？",
    "最近ハマっているゲーム・アニメ・動画チャンネルは？",
    "今まで行った旅行先で一番印象に残っている場所は？",
    "「これだけは絶対に許せない！」日常のプチストレス",
    "朝型？夜型？ついつい夜更かししちゃう理由は？",
    "学生時代の一番の思い出、または戻りたい学年は？",
    "もし異世界に転生したらどんな職業・役職になりたい？",
    "犬派？猫派？それとも別の動物派？",
    "今までで一番緊張した出来事は？",
    "自分のチャームポイントや密かに自慢したい特技は？",
    "最近知って「へぇ〜！」と思った雑学やニュースは？",
    "カラオケに行ったら絶対に歌う勝負曲はある？"
];
exports.WORD_WOLF_PAIRS = [
    { majority: "ラーメン", minority: "うどん" },
    { majority: "映画館", minority: "水族館" },
    { majority: "スマートフォン", minority: "パソコン" },
    { majority: "遊園地", minority: "動物園" },
    { majority: "焼肉", minority: "寿司" },
    { majority: "コーヒー", minority: "紅茶" },
    { majority: "夏休み", minority: "冬休み" },
    { majority: "マクドナルド", minority: "モスバーガー" },
    { majority: "カレーライス", minority: "シチュー" },
    { majority: "海", minority: "プール" },
    { majority: "目覚まし時計", minority: "スマホのアラーム" },
    { majority: "チョコレート", minority: "アイスクリーム" },
    { majority: "東京タワー", minority: "スカイツリー" },
    { majority: "新幹線", minority: "飛行機" },
    { majority: "LINE", minority: "メール" },
    { majority: "シャンプー", minority: "ボディソープ" },
    { majority: "コンビニ", minority: "スーパーマーケット" },
    { majority: "お化け屋敷", minority: "ジェットコースター" },
    { majority: "スキー", minority: "スノーボード" },
    { majority: "野球", minority: "サッカー" }
];
function getRandomTopic() {
    const index = Math.floor(Math.random() * exports.TALK_TOPICS.length);
    return exports.TALK_TOPICS[index];
}
function getRandomWordWolfPair() {
    const index = Math.floor(Math.random() * exports.WORD_WOLF_PAIRS.length);
    const pair = exports.WORD_WOLF_PAIRS[index];
    // 50%の確率でどちらが多数派・少数派かを入れ替える
    if (Math.random() > 0.5) {
        return { majority: pair.minority, minority: pair.majority };
    }
    return { ...pair };
}
