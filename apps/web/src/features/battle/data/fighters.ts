export interface FighterCategory {
  name: string;
  emoji: string;
  fighters: string[];
}

export const FIGHTER_CATEGORIES: FighterCategory[] = [
  {
    name: 'Animals',
    emoji: '\u{1F43E}',
    fighters: ['Cats', 'Dogs', 'Squirrels', 'Penguins', 'Bears', 'Rabbits', 'Sharks', 'Eagles', 'Monkeys', 'Turtles', 'Wolves', 'Dolphins'],
  },
  {
    name: 'Dinosaurs',
    emoji: '\u{1F996}',
    fighters: ['T-Rex', 'Velociraptors', 'Triceratops', 'Pterodactyls', 'Stegosaurus', 'Brachiosaurus', 'Spinosaurus', 'Ankylosaurus'],
  },
  {
    name: 'Fantasy',
    emoji: '\u{1F9D9}',
    fighters: ['Dragons', 'Unicorns', 'Wizards', 'Giants', 'Fairies', 'Goblins', 'Elves', 'Trolls', 'Mermaids', 'Phoenixes'],
  },
  {
    name: 'Robots & Tech',
    emoji: '\u{1F916}',
    fighters: ['Robot Dogs', 'Drones', 'Giant Mechs', 'AI Assistants', 'Cyborgs', 'Nanobots', 'Robot Armies', 'Laser Cats'],
  },
  {
    name: 'Food',
    emoji: '\u{1F354}',
    fighters: ['Pizza Slices', 'Tacos', 'Sushi Rolls', 'Cupcakes', 'Hot Dogs', 'Ice Cream Cones', 'Broccoli Soldiers', 'Cookie Warriors'],
  },
  {
    name: 'Space',
    emoji: '\u{1F680}',
    fighters: ['Aliens', 'Astronauts', 'Space Pirates', 'Star Warriors', 'Moon Creatures', 'Cosmic Jellyfish', 'Planet Guardians'],
  },
  {
    name: 'Mythical',
    emoji: '\u{1F3DB}\uFE0F',
    fighters: ['Ninjas', 'Pirates', 'Vikings', 'Knights', 'Samurai', 'Gladiators', 'Pharaohs', 'Spartans'],
  },
];

export const SETTINGS = [
  'a Playground',
  'Space',
  'an Underwater Kingdom',
  'a Volcano',
  'a Candy Factory',
  'a Haunted Castle',
  'the Moon',
  'a Giant Kitchen',
  'a Jungle',
  'a Cloud City',
  'an Ice Planet',
  'a Library That Came Alive',
  'a Video Game World',
  'a Time Machine',
];

export const TWISTS = [
  'they have to work together to escape',
  'the loser gets to eat all the cake',
  'it starts raining marshmallows',
  'a surprise referee appears',
  'the setting starts shrinking',
  'everyone switches powers',
  'gravity turns upside down',
  'they discover they are related',
  'a third challenger arrives',
  'they realize it was all a dream... or was it?',
  'the real enemy was boredom all along',
  'the winner has to do the loser\'s homework',
];

export const FIGHTERS_FR: Record<string, string> = {
  // Animals
  'Cats': 'Chats', 'Dogs': 'Chiens', 'Squirrels': 'Écureuils', 'Penguins': 'Pingouins',
  'Bears': 'Ours', 'Rabbits': 'Lapins', 'Sharks': 'Requins', 'Eagles': 'Aigles',
  'Monkeys': 'Singes', 'Turtles': 'Tortues', 'Wolves': 'Loups', 'Dolphins': 'Dauphins',
  // Dinosaurs
  'T-Rex': 'T-Rex', 'Velociraptors': 'Vélociraptors', 'Triceratops': 'Tricératops',
  'Pterodactyls': 'Ptérodactyles', 'Stegosaurus': 'Stégosaure', 'Brachiosaurus': 'Brachiosaure',
  'Spinosaurus': 'Spinosaure', 'Ankylosaurus': 'Ankylosaure',
  // Fantasy
  'Dragons': 'Dragons', 'Unicorns': 'Licornes', 'Wizards': 'Sorciers', 'Giants': 'Géants',
  'Fairies': 'Fées', 'Goblins': 'Gobelins', 'Elves': 'Elfes', 'Trolls': 'Trolls',
  'Mermaids': 'Sirènes', 'Phoenixes': 'Phénix',
  // Robots & Tech
  'Robot Dogs': 'Chiens Robots', 'Drones': 'Drones', 'Giant Mechs': 'Méca Géants',
  'AI Assistants': 'Assistants IA', 'Cyborgs': 'Cyborgs', 'Nanobots': 'Nanobots',
  'Robot Armies': 'Armées de Robots', 'Laser Cats': 'Chats Laser',
  // Food
  'Pizza Slices': 'Parts de Pizza', 'Tacos': 'Tacos', 'Sushi Rolls': 'Rouleaux de Sushi',
  'Cupcakes': 'Cupcakes', 'Hot Dogs': 'Hot Dogs', 'Ice Cream Cones': 'Cornets de Glace',
  'Broccoli Soldiers': 'Soldats Brocolis', 'Cookie Warriors': 'Guerriers Cookies',
  // Space
  'Aliens': 'Extraterrestres', 'Astronauts': 'Astronautes', 'Space Pirates': 'Pirates de l\'Espace',
  'Star Warriors': 'Guerriers des Étoiles', 'Moon Creatures': 'Créatures Lunaires',
  'Cosmic Jellyfish': 'Méduses Cosmiques', 'Planet Guardians': 'Gardiens des Planètes',
  // Mythical
  'Ninjas': 'Ninjas', 'Pirates': 'Pirates', 'Vikings': 'Vikings', 'Knights': 'Chevaliers',
  'Samurai': 'Samouraïs', 'Gladiators': 'Gladiateurs', 'Pharaohs': 'Pharaons', 'Spartans': 'Spartiates',
};

export const FIGHTERS_ZH: Record<string, string> = {
  // Animals
  'Cats': '猫咪', 'Dogs': '狗狗', 'Squirrels': '松鼠', 'Penguins': '企鹅',
  'Bears': '熊', 'Rabbits': '兔子', 'Sharks': '鲨鱼', 'Eagles': '老鹰',
  'Monkeys': '猴子', 'Turtles': '乌龟', 'Wolves': '狼', 'Dolphins': '海豚',
  // Dinosaurs
  'T-Rex': '霸王龙', 'Velociraptors': '迅猛龙', 'Triceratops': '三角龙',
  'Pterodactyls': '翼龙', 'Stegosaurus': '剑龙', 'Brachiosaurus': '腕龙',
  'Spinosaurus': '棘龙', 'Ankylosaurus': '甲龙',
  // Fantasy
  'Dragons': '龙', 'Unicorns': '独角兽', 'Wizards': '巫师', 'Giants': '巨人',
  'Fairies': '仙子', 'Goblins': '哥布林', 'Elves': '精灵', 'Trolls': '巨魔',
  'Mermaids': '美人鱼', 'Phoenixes': '凤凰',
  // Robots & Tech
  'Robot Dogs': '机器狗', 'Drones': '无人机', 'Giant Mechs': '巨型机甲',
  'AI Assistants': 'AI助手', 'Cyborgs': '半机械人', 'Nanobots': '纳米机器人',
  'Robot Armies': '机器人军团', 'Laser Cats': '激光猫',
  // Food
  'Pizza Slices': '披萨', 'Tacos': '墨西哥卷饼', 'Sushi Rolls': '寿司卷',
  'Cupcakes': '纸杯蛋糕', 'Hot Dogs': '热狗', 'Ice Cream Cones': '冰淇淋',
  'Broccoli Soldiers': '西兰花战士', 'Cookie Warriors': '饼干勇士',
  // Space
  'Aliens': '外星人', 'Astronauts': '宇航员', 'Space Pirates': '太空海盗',
  'Star Warriors': '星际战士', 'Moon Creatures': '月球生物',
  'Cosmic Jellyfish': '宇宙水母', 'Planet Guardians': '星球守护者',
  // Mythical
  'Ninjas': '忍者', 'Pirates': '海盗', 'Vikings': '维京人', 'Knights': '骑士',
  'Samurai': '武士', 'Gladiators': '角斗士', 'Pharaohs': '法老', 'Spartans': '斯巴达人',
};

export const SETTINGS_FR: Record<string, string> = {
  'a Playground': 'une cour de récréation',
  'Space': 'l\'Espace',
  'an Underwater Kingdom': 'un royaume sous-marin',
  'a Volcano': 'un volcan',
  'a Candy Factory': 'une usine à bonbons',
  'a Haunted Castle': 'un château hanté',
  'the Moon': 'la Lune',
  'a Giant Kitchen': 'une cuisine géante',
  'a Jungle': 'une jungle',
  'a Cloud City': 'une cité dans les nuages',
  'an Ice Planet': 'une planète de glace',
  'a Library That Came Alive': 'une bibliothèque qui a pris vie',
  'a Video Game World': 'un monde de jeux vidéo',
  'a Time Machine': 'une machine à voyager dans le temps',
};

export const SETTINGS_ZH: Record<string, string> = {
  'a Playground': '游乐场',
  'Space': '太空',
  'an Underwater Kingdom': '海底王国',
  'a Volcano': '火山',
  'a Candy Factory': '糖果工厂',
  'a Haunted Castle': '鬼城堡',
  'the Moon': '月球',
  'a Giant Kitchen': '巨大厨房',
  'a Jungle': '丛林',
  'a Cloud City': '云中之城',
  'an Ice Planet': '冰雪星球',
  'a Library That Came Alive': '活过来的图书馆',
  'a Video Game World': '电子游戏世界',
  'a Time Machine': '时光机',
};

export const TWISTS_FR: Record<string, string> = {
  'they have to work together to escape': 'ils doivent travailler ensemble pour s\'échapper',
  'the loser gets to eat all the cake': 'le perdant mange tout le gâteau',
  'it starts raining marshmallows': 'il commence à pleuvoir des guimauves',
  'a surprise referee appears': 'un arbitre surprise apparaît',
  'the setting starts shrinking': 'le décor commence à rétrécir',
  'everyone switches powers': 'tout le monde échange ses pouvoirs',
  'gravity turns upside down': 'la gravité s\'inverse',
  'they discover they are related': 'ils découvrent qu\'ils sont de la même famille',
  'a third challenger arrives': 'un troisième adversaire arrive',
  'they realize it was all a dream... or was it?': 'ils réalisent que c\'était un rêve... ou pas?',
  'the real enemy was boredom all along': 'le vrai ennemi était l\'ennui depuis le début',
  'the winner has to do the loser\'s homework': 'le gagnant doit faire les devoirs du perdant',
};

export const TWISTS_ZH: Record<string, string> = {
  'they have to work together to escape': '他们必须合作才能逃脱',
  'the loser gets to eat all the cake': '输的人可以吃掉所有的蛋糕',
  'it starts raining marshmallows': '天上开始下棉花糖雨',
  'a surprise referee appears': '一个神秘裁判突然出现了',
  'the setting starts shrinking': '周围的环境开始缩小',
  'everyone switches powers': '大家的能力互换了',
  'gravity turns upside down': '重力颠倒了',
  'they discover they are related': '他们发现原来是一家人',
  'a third challenger arrives': '第三个挑战者出现了',
  'they realize it was all a dream... or was it?': '他们发现这一切都是一场梦……还是真的？',
  'the real enemy was boredom all along': '真正的敌人一直都是无聊',
  'the winner has to do the loser\'s homework': '赢的人要帮输的人写作业',
};

export const NUMBER_OPTIONS = [1, 2, 3, 5, 10, 20, 50, 100, 1000];
