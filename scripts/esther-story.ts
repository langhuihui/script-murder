import type { GameScript } from '../src/types/script';

export const estherScript: GameScript = {
  id: 'esther-story',
  title: '以斯帖记：王后的勇气',
  description: '这是一个基于圣经以斯帖记的剧本杀故事。波斯帝国时期，犹太少女以斯帖成为王后，面对宰相哈曼的种族灭绝计划，她需要冒着生命危险拯救自己的同胞。',
  maxPlayers: 6,
  minPlayers: 4,
  estimatedTime: 90,
  difficulty: 'medium',
  theme: {
    cssPath: './themes/esther-story.css',
    colors: {
      primary: '#8B4513',
      secondary: '#D4AF37',
      background: 'linear-gradient(135deg, #2C1810 0%, #4A2C1A 50%, #6B4423 100%)',
      text: '#F5E6D3',
      accent: '#C9A961'
    },
    fontFamily: 'Georgia, "Times New Roman", serif'
  },

  characters: [
    {
      id: 'esther',
      name: '以斯帖',
      title: '波斯王后',
      description: '美丽的犹太少女，被选为波斯王后，善良而勇敢。',
      avatar: '/images/characters/esther.svg',
      background: '我是一名犹太孤儿，被堂兄末底改抚养长大。在王后选拔中，我被选为薛西斯王的王后，但一直隐藏着我的犹太身份。',
      secret: '我是犹太人，如果暴露身份可能会被处死，但我的同胞正面临危险。',
      goal: '拯救所有犹太人，揭露哈曼的阴谋。',
      skills: ['智慧', '美丽', '勇气']
    },
    {
      id: 'xerxes',
      name: '薛西斯王',
      title: '波斯帝国之王',
      description: '强大的波斯国王，威严而多疑，喜欢奢华和服从。',
      avatar: '/images/characters/xerxes.svg',
      background: '我是世界上最强大的统治者。我的王国横跨三大洲，我拥有无尽的财富和权力。最近我废黜了王后瓦实提，正在寻找新的王后。',
      secret: '我其实很孤独，渴望真正的爱情和建议，但我不能表现软弱。',
      goal: '维护帝国的稳定，找到值得信任的人。',
      skills: ['权威', '财富', '政治手腕']
    },
    {
      id: 'haman',
      name: '哈曼',
      title: '帝国宰相',
      description: '权势滔天的宰相，野心勃勃，对犹太人怀有深深的仇恨。',
      avatar: '/images/characters/haman.svg',
      background: '我是国王最信任的宰相，拥有巨大的权力。末底改拒绝向我跪拜，这是对我尊严的侮辱。',
      secret: '我已经说服国王颁布法令，要在特定日期屠杀所有犹太人。',
      goal: '消灭所有犹太人，特别是末底改。',
      skills: ['政治手腕', '影响力', '阴谋']
    },
    {
      id: 'mordecai',
      name: '末底改',
      title: '犹太领袖',
      description: '以斯帖的堂兄，虔诚的犹太人，有正义感和预知能力。',
      avatar: '/images/characters/mordecai.svg',
      background: '我是以斯帖的堂兄和监护人，一直在皇宫门口担任守卫。我发现了有人要谋害国王的阴谋，救了国王的命。',
      secret: '我知道哈曼要消灭犹太人的计划，我告诉以斯帖她必须为此挺身而出。',
      goal: '保护犹太同胞，揭露哈曼的邪恶计划。',
      skills: ['智慧', '正义', '预知']
    },
    {
      id: 'vashti',
      name: '瓦实提',
      title: '废后',
      description: '被废黜的王后，美丽而高傲，对王位有强烈的执念。',
      avatar: '/images/characters/vashti.svg',
      background: '我曾是薛西斯王的王后，但因为拒绝在宴会中展示美貌而被废黜。我现在住在宫殿的僻静处，但仍然关注着宫廷的一切。',
      secret: '我知道一些宫廷的秘密，包括某些贵族的弱点，我想重新获得王后的地位。',
      goal: '重新获得王后的地位，报复那些让我失去地位的人。',
      skills: ['魅力', '情报', '影响力']
    },
    {
      id: 'zachary',
      name: '撒迦利亚',
      title: '宫廷太监长',
      description: '负责管理后宫的太监长，了解宫廷内部运作。',
      avatar: '/images/characters/zachary.svg',
      background: '我在宫中服务多年，负责后宫的日常管理。我见证了王后的更替，也了解很多宫廷秘密。',
      secret: '我掌握着宫中所有人的秘密，包括国王的喜好和官员的私下交易。',
      goal: '保持自己的地位，在政治斗争中生存下来。',
      skills: ['情报', '谨慎', '观察力']
    }
  ],

  phases: [
    {
      id: 'character_introduction',
      name: '角色介绍',
      description: '玩家阅读自己的角色背景，了解游戏设定。',
      duration: 10,
      actions: ['read_character', 'introduce_self']
    },
    {
      id: 'palace_life',
      name: '宫廷生活',
      description: '了解宫廷日常，收集初始信息。',
      duration: 15,
      actions: ['explore_palace', 'talk_to_others', 'find_initial_clues']
    },
    {
      id: 'crisis_emerges',
      name: '危机降临',
      description: '哈曼的阴谋开始显现，犹太人面临威胁。',
      duration: 20,
      actions: ['discover_plot', 'secret_meeting', 'plan_response']
    },
    {
      id: 'queen_decision',
      name: '王后的抉择',
      description: '以斯帖需要决定是否冒险面见国王。',
      duration: 15,
      actions: ['make_decision', 'seek_support', 'prepare_plan']
    },
    {
      id: 'royal_banquet',
      name: '御前宴会',
      description: '关键的对决时刻，在宴会上揭露真相。',
      duration: 20,
      actions: ['attend_banquet', 'present_evidence', 'make_accusation']
    },
    {
      id: 'final_judgment',
      name: '最终审判',
      description: '投票决定结果，揭示真相。',
      duration: 10,
      actions: ['vote', 'reveal_truth', 'conclusion']
    }
  ],

  clues: [
    {
      id: 'royal_edict',
      name: '国王法令',
      description: '一份关于屠杀犹太人的国王法令。',
      type: 'document',
      icon: '📜',
      discovered: false,
      content: '奉国王之名：所有帝国境内的犹太人，无论老幼，在第13月第13日都要被处死，其财产可被任何人夺取。'
    },
    {
      id: 'mordecai_testimony',
      name: '末底改的证词',
      description: '末底改对哈曼阴谋的详细描述。',
      type: 'testimony',
      icon: '🗣️',
      discovered: false,
      content: '我无意中听到哈曼向国王进言，说犹太人违背帝国法律，应当被彻底消灭。'
    },
    {
      id: 'palace_gossip',
      name: '宫廷流言',
      description: '宫中流传的有关哈曼野心的传言。',
      type: 'testimony',
      icon: '🤫',
      discovered: false,
      content: '有人说哈曼想要建立自己的势力范围，他的目标不仅仅是犹太人...'
    },
    {
      id: 'vashti_letter',
      name: '瓦实提的信件',
      description: '废后瓦实提写的一封神秘信件。',
      type: 'document',
      icon: '📝',
      discovered: false,
      content: '我知道一些关于哈曼的事情，他不是表面上看起来那么忠诚...'
    },
    {
      id: 'accounting_record',
      name: '财务记录',
      description: '显示哈曼向国王行贿的账本。',
      type: 'document',
      icon: '🧮',
      discovered: false,
      content: '宰相哈曼"献金"一万塔兰特的记录，这笔钱来自不明来源。'
    },
    {
      id: 'guard_report',
      name: '守卫报告',
      description: '关于末底改救驾事件的官方记录。',
      type: 'document',
      icon: '🛡️',
      discovered: false,
      content: '守卫报告：末底改发现了刺杀国王的阴谋，及时报告，拯救了国王的生命。'
    },
    {
      id: 'haman_diary',
      name: '哈曼的日记',
      description: '哈曼记录个人想法的秘密日记。',
      type: 'document',
      icon: '📖',
      discovered: false,
      content: '末底改这个犹太人竟然不肯跪拜我！我要让他和他所有的族人都付出代价！'
    },
    {
      id: 'royal_favor',
      name: '国王恩宠',
      description: '国王赐予末底改的荣誉证明。',
      type: 'object',
      icon: '👑',
      discovered: false,
      content: '国王赐予末底改荣誉的记录：让他穿上王袍，骑上御马，由哈曼牵马游街。'
    }
  ],

  storyline: [
    '故事开始于波斯帝国的首都苏撒。薛西斯王在位第三年，举行盛大宴会。',
    '王后瓦实提拒绝在宴会中展示美貌，被废黜王位。',
    '美丽的犹太少女以斯帖被选为新的王后，但隐瞒了犹太身份。',
    '末底改在宫门口发现刺杀国王的阴谋，救了国王的命，但功劳未被记录。',
    '哈曼被提升为宰相，要求所有人向他跪拜，但末底改拒绝。',
    '哈曼大怒，决定消灭所有犹太人，说服国王颁布灭绝法令。',
    '末底改和犹太人陷入绝望，恳求以斯帖向国王求情。',
    '以斯帖决定冒生命危险，未经召见面见国王。',
    '以斯帖邀请国王和哈曼参加宴会，逐步揭露真相。',
    '在第二次宴会上，以斯帖揭露哈曼的阴谋和自己的犹太身份。',
    '国王大怒，下令处死哈曼，将财产赐给以斯帖。',
    '末底改被提升为宰相，新的法令允许犹太人自卫。',
    '犹太人获得胜利，设立普珥节庆祝。'
  ]
};

