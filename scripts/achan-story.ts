import type { GameScript } from '../src/types/script';

export const achanScript: GameScript = {
  id: 'achan-story',
  title: '迦南的诅咒',
  description: '以色列人攻克迦南坚城后，却在下一场战役中惨遭失败。神揭示有人私藏了当灭之物，以色列必须找出这个罪人。玩家需要通过调查和推理，在众人中找出隐藏的罪犯。',
  maxPlayers: 10,
  minPlayers: 4,
  estimatedTime: 90,
  difficulty: 'medium',
  theme: {
    cssPath: './themes/achan-story.css',
    colors: {
      primary: '#8B0000',
      secondary: '#CD853F',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      text: '#E8DCC4',
      accent: '#DAA520'
    },
    fontFamily: 'Georgia, "Times New Roman", serif'
  },

  // 真凶ID，用于掣签验证（内部使用，玩家看不到）
  culpritId: 'carmi',

  // 角色配置：根据人数分配
  // 4人：约书亚、迦密、迦勒、喇合（核心阵容）
  // 5人：+非尼哈
  // 6人：+亚伯（迦勒之子）
  // 7人：+以法莲（喇合之弟）
  // 8人：+拿单（约书亚副官）
  // 9人：+基遍人（外来者）
  // 10人：+底波拉（女先知）
  characterConfig: {
    required: ['joshua', 'carmi', 'caleb', 'rahab'], // 4人必选
    optional: [
      { minPlayers: 5, characterId: 'phinehas' },
      { minPlayers: 6, characterId: 'abel' },      // 迦勒之子
      { minPlayers: 7, characterId: 'ephraim' },   // 喇合之弟
      { minPlayers: 8, characterId: 'nathan' },    // 约书亚副官
      { minPlayers: 9, characterId: 'gibeonite' },
      { minPlayers: 10, characterId: 'deborah' }
    ]
  },

  characters: [
    // ========== 核心角色（4人必选）==========
    {
      id: 'joshua',
      name: '约书亚',
      title: '以色列领袖',
      description: '摩西的继承人，带领以色列人进入应许之地的军事领袖。',
      avatar: '/images/characters/joshua.svg',
      priority: 1, // 优先级，数字越小越优先分配
      background: `我是摩西的继承人，神亲自拣选我带领以色列人进入迦南地。

【战前】我召集众支派长老，重申神的命令：城中一切都要毁灭，金银铜铁要归入耶和华的库中。我特别警告众人，不可贪恋当灭之物，免得连累全营。

【战中】城墙倒塌后，我指挥各支派从不同方向进攻。战斗很混乱，我主要在北门指挥，无法看到所有人的行动。我注意到迦勒带领的队伍冲进了王宫区域。

【战后】我安排非尼哈清点献给神的财物，但他报告说王宫的宝库似乎被人翻动过，有些东西可能遗失了。我当时以为是战斗中的混乱所致，没有深究。

【小城之败】三千人进攻小城，却被杀了三十六人，狼狈逃回。我撕裂衣服俯伏在约柜前，神告诉我有人犯了罪。`,
      secret: '我对迦勒有些怀疑——他的队伍负责王宫区域，而宝物正是从那里失踪的。但迦勒是我四十年的战友，我不愿相信是他。我决定先让众人自行调查，最后用掣签来确认神的旨意。',
      goal: '找出私藏当灭之物的罪人，恢复以色列与神的关系。你需要主持调查，听取各方证词，最终组织投票。',
      relationships: {
        caleb: '四十年的战友，最信任的人，但这次他负责的区域出了问题',
        phinehas: '祭司，负责宗教事务，掣签需要他来执行',
        carmi: '犹大支派的年轻战士，战斗中表现勇敢',
        rahab: '归化者，对以色列忠心，但有人质疑她的身份'
      },
      timeline: [
        { time: '战前黄昏', event: '召集长老会议，宣布神的命令' },
        { time: '战斗开始', event: '在北门指挥主力部队' },
        { time: '城墙倒塌', event: '下令全军进攻' },
        { time: '战斗中', event: '处理北门的抵抗，无法顾及其他区域' },
        { time: '战斗结束', event: '回到营地，听取各方汇报' },
        { time: '次日', event: '安排清点战利品，发现有遗失' }
      ],
      skills: ['领导力', '信仰', '军事策略'],
      priority: 1
    },
    {
      id: 'carmi',
      name: '迦密',
      title: '犹大支派战士',
      description: '犹大支派的一员，参与了攻城之战。',
      avatar: '/images/characters/carmi.svg',
      priority: 2, // 真凶必须分配
      background: `我是犹大支派的战士，跟随迦勒参与了攻城之战。

【战前】我听了约书亚的命令，心中却在想：这么多财宝都要毁掉，太可惜了。我暗暗打定主意，如果有机会，一定要拿一些。

【战中】我跟随迦勒的队伍冲进王宫区域。在混乱中，我看到了宝库——里面有一件华美的外邦衣服、成堆的银子和金饰。我趁四周无人，迅速拿了衣服、一袋银子和一块金饰，藏在战袍里。

【战后】我假装和其他人一起搜索，实际上是在寻找机会脱身。我注意到喇合在附近徘徊，不知道她有没有看到什么。回到营地后，我趁夜色把东西埋在帐篷下面。

【现在】小城战败后，我知道神在追讨罪。我必须想办法把嫌疑引向别人。迦勒也在王宫区域，喇合是迦南人，他们都可以成为替罪羊。`,
      secret: '我就是那个私藏当灭之物的人。我把一件华美衣服、一袋银子和一块金饰埋在了帐篷里。我必须隐藏这个秘密，把嫌疑引向别人。',
      goal: '【隐藏身份】你是真凶，必须隐藏自己的罪行。你可以：1）把嫌疑引向迦勒（他也在王宫区域）；2）暗示喇合可能私藏了家乡的财物；3）质疑其他人对你的指控是出于私怨。如果被投票选中，掣签会揭示真相。',
      relationships: {
        joshua: '敬畏的领袖，但他的命令太严苛了',
        caleb: '我的直属长官，他也在王宫区域，可以把嫌疑引向他',
        phinehas: '祭司，掣签会揭示真相，必须在投票阶段就洗清嫌疑',
        rahab: '迦南人，可以暗示她私藏了家乡的财物'
      },
      timeline: [
        { time: '战前黄昏', event: '参加长老会议，暗中打定主意' },
        { time: '战斗开始', event: '跟随迦勒的队伍' },
        { time: '城墙倒塌', event: '冲向王宫区域' },
        { time: '战斗中', event: '【真实】趁乱进入宝库，私藏财物' },
        { time: '战斗中', event: '【对外说法】在王宫区域与敌人战斗' },
        { time: '战斗结束', event: '和队伍一起返回，途中看到喇合' },
        { time: '当夜', event: '趁夜色把财物埋在帐篷下' }
      ],
      skills: ['欺骗', '狡辩', '观察'],
      alibis: [
        '我一直跟着迦勒的队伍行动，从未单独离开',
        '王宫区域有很多人，不只是我一个',
        '我看到喇合在战后独自在王宫附近徘徊'
      ],
      priority: 2
    },
    // ========== 核心角色：迦勒 ==========
    {
      id: 'caleb',
      name: '迦勒',
      title: '犹大支派长老',
      description: '与约书亚一同探过迦南地的老战士，信心坚定。',
      avatar: '/images/characters/caleb.svg',
      priority: 3,
      background: `四十年前，我和约书亚是十二个探子中唯一相信神能带领我们进入迦南的人。如今我虽然八十五岁，但仍然强壮如昔。

【战前】约书亚把攻打王宫的任务交给了我，因为那里防守最严密，需要最精锐的战士。我挑选了犹大支派最勇敢的年轻人，包括迦密。

【战中】城墙倒塌后，我带队冲向王宫。战斗很激烈，我亲手杀了国王的护卫长。在混战中，我的队伍分散了，我无法看到每个人的行动。我记得迦密一度消失了一会儿，但战场上这很正常。

【战后】我进入王宫宝库清点财物，发现有些东西似乎被翻动过。我以为是战斗中的混乱所致，就向约书亚报告了情况。我还看到喇合在王宫附近，她说是在寻找家人的遗物。

【现在】小城的失败让我震惊。我开始回想战斗中的细节，迦密那次消失让我起了疑心。但我没有证据，不能随意指控。`,
      secret: '我在战斗中确实有一段时间无法看到迦密。而且我注意到他战后回来时，战袍似乎比之前鼓了一些。但这只是我的猜测，我不能因为猜测就指控一个勇敢的战士。另外，我自己也有把柄——我曾私下留了一枚国王的印章作为纪念，虽然那不是"当灭之物"，但如果被发现，会让我的证词失去可信度。',
      goal: '协助约书亚找出罪人。你怀疑迦密，但没有确凿证据。你需要小心处理自己私留印章的事，不要让它影响调查。',
      relationships: {
        joshua: '四十年的战友，彼此信任',
        carmi: '我队伍中的年轻战士，勇敢但有时贪婪',
        phinehas: '虔诚的祭司，值得信赖',
        rahab: '归化者，我在王宫附近见过她'
      },
      timeline: [
        { time: '战前黄昏', event: '接受约书亚的任务，挑选精兵' },
        { time: '战斗开始', event: '带队在王宫方向集结' },
        { time: '城墙倒塌', event: '率先冲向王宫' },
        { time: '战斗中', event: '与护卫长激战，队伍分散' },
        { time: '战斗中', event: '注意到迦密消失了一会儿' },
        { time: '战斗结束', event: '清点宝库，发现异常' },
        { time: '战后', event: '私下留了一枚印章（非当灭之物）' }
      ],
      skills: ['观察力', '信仰', '正直'],
      priority: 3
    },
    // ========== 核心角色：喇合 ==========
    {
      id: 'rahab',
      name: '喇合',
      title: '归化者',
      description: '迦南城的女子，因保护以色列探子而全家得救。',
      avatar: '/images/characters/rahab.svg',
      priority: 4,
      background: `我曾是迦南城的女子，但我相信以色列的神是天上地下的真神。我保护了以色列的探子，所以我和我的全家在城破时得救了。

【战前】我告诉以色列人城中的情况，包括王宫宝库的位置。我知道那里有三件最珍贵的宝物：华美衣服、银子和金饰。

【战中】我和家人躲在城墙边的房子里，等待以色列人来救我们。我从窗户看到战斗的情况。

【战后】以色列人把我和家人带出城。在离开前，我回到王宫附近，想找一些家人的遗物。我看到一个以色列战士从宝库方向出来，战袍鼓鼓的。我没看清他的脸，但他往犹大支派的方向去了。后来我还看到迦勒在宝库里，他似乎在找什么东西。

【现在】我知道的信息可能很重要，但我是外邦人，我的话会被相信吗？而且如果我说出来，可能会得罪犹大支派的人。`,
      secret: '我看到的那个战士，虽然没看清脸，但我注意到他的腰带是深红色的。我还有一个秘密：我从城里带出了一个小银盒，里面是我母亲的遗物。这不是"当灭之物"，只是普通的首饰盒，但如果被发现，可能会让人怀疑我。',
      goal: '帮助以色列人找出罪人，证明自己对神的忠诚。你需要决定是否公开你看到的一切，以及如何处理自己带出银盒的事。',
      relationships: {
        joshua: '救了我全家的人，我要报答他',
        caleb: '我在王宫附近看到他，他在找什么？',
        carmi: '我看到一个战士从宝库出来，可能是他',
        phinehas: '祭司，我想向他证明我的信仰'
      },
      timeline: [
        { time: '战前', event: '向以色列人提供情报' },
        { time: '战斗中', event: '和家人躲在房子里' },
        { time: '城墙倒塌后', event: '等待以色列人来救援' },
        { time: '战斗结束', event: '被带出城，回王宫找遗物' },
        { time: '在王宫附近', event: '看到一个战士从宝库出来' },
        { time: '稍后', event: '看到迦勒在宝库里' },
        { time: '离开时', event: '带走了母亲的银盒（非当灭之物）' }
      ],
      timeline: [
        { time: '战前', event: '向以色列人提供情报' },
        { time: '战斗中', event: '和家人躲在房子里' },
        { time: '城墙倒塌后', event: '等待以色列人来救援' },
        { time: '战斗结束', event: '被带出城，回王宫找遗物' },
        { time: '在王宫附近', event: '看到一个战士从宝库出来' },
        { time: '稍后', event: '看到迦勒在宝库里' },
        { time: '离开时', event: '带走了母亲的银盒（非当灭之物）' }
      ],
      skills: ['情报', '观察', '生存智慧'],
      priority: 4
    },

    // ========== 可选角色（5人起）==========
    {
      id: 'phinehas',
      name: '非尼哈',
      title: '祭司',
      description: '大祭司以利亚撒的儿子，负责以色列的宗教事务。',
      avatar: '/images/characters/phinehas.svg',
      priority: 5,
      background: `我是大祭司以利亚撒的儿子，负责在神面前为以色列人献祭和掣签。

【战前】我在会幕前为以色列人祈福，求神赐下胜利。我没有参与战斗，而是在营地等候。

【战中】我在营地听到城墙倒塌的声音，知道神行了大事。我开始准备接收献给神的财物。

【战后】迦勒的人把王宫的财物送来，但清点时发现数目似乎不对。我向约书亚报告了这件事。那天晚上，我在营地巡视时，看到有人在帐篷区域挖土。天太黑了，我只看到是个年轻人的身影，往犹大支派的方向去了。

【小城之败后】我在会幕前察看，发现神的同在似乎离开了营地。约书亚来求问，神告诉他有人犯了罪。神指示要用掣签来找出罪人。`,
      secret: '我那晚看到的挖土之人，身形像是迦密。但天太黑，我不能确定。我还注意到迦勒之子亚伯那晚也在营地徘徊，似乎在找什么人。',
      goal: '通过神圣的程序找出罪人。你掌握着掣签的权力，但必须等到众人投票后才能使用。你需要在调查阶段提供你所知道的线索。',
      relationships: {
        joshua: '以色列的领袖，我要协助他',
        caleb: '信心坚定的长老',
        carmi: '犹大支派的年轻战士，那晚的身影像他',
        rahab: '归化者，她对神很虔诚'
      },
      timeline: [
        { time: '战前黄昏', event: '在会幕前祈祷' },
        { time: '战斗中', event: '在营地等候，准备接收财物' },
        { time: '战斗结束', event: '清点献上的财物，发现数目不对' },
        { time: '当夜', event: '巡视时看到有人挖土，往犹大支派方向' },
        { time: '次日', event: '向约书亚报告财物遗失' },
        { time: '小城之败后', event: '在会幕求问，得到神的指示' }
      ],
      skills: ['祭司职分', '掣签', '属灵洞察']
    },

    // ========== 可选角色（6人起）：迦勒之子 ==========
    {
      id: 'abel',
      name: '亚伯',
      title: '迦勒之子',
      description: '迦勒的儿子，年轻有为的战士。',
      avatar: '/images/characters/abel.svg',
      priority: 6,
      background: `我是迦勒的儿子，继承了父亲的勇气和信心。

【战前】父亲把我留在后方，说我还需要更多历练。我很不服气，但只能服从。

【战中】我在后方焦急等待，听到城墙倒塌的声音时激动不已。

【战后】父亲平安归来，我去迎接他。我注意到他的战袍口袋里鼓鼓的，问他是什么，他含糊其辞说是战场上捡的小东西。后来我在他帐篷里看到一枚印章，但他不让我碰。

【那天晚上】我睡不着，在营地散步。我看到一个人影在帐篷区域挖土，但天太黑看不清是谁。我还看到迦密从那个方向走回来。

【现在】我怀疑父亲藏了什么东西，但我不愿意相信他会违背神的命令。那个挖土的人是谁？是父亲还是迦密？`,
      secret: '我看到父亲藏了一枚印章，虽然那可能不是"当灭之物"，但这让我很困惑。而且那晚我看到迦密从帐篷区域走回来，他的行为很可疑。我不知道该相信谁。',
      goal: '你陷入两难：一方面怀疑父亲，另一方面看到迦密的可疑行为。你需要查明真相，但要小心不要冤枉无辜的人——包括你的父亲。',
      relationships: {
        joshua: '敬畏的领袖，父亲的战友',
        caleb: '我的父亲，我看到他藏了印章',
        carmi: '那晚从帐篷区走回来的人',
        phinehas: '祭司，值得信赖',
        rahab: '归化者，父亲在王宫附近见过她'
      },
      timeline: [
        { time: '战前黄昏', event: '被父亲留在后方' },
        { time: '战斗中', event: '在后方焦急等待' },
        { time: '战斗结束', event: '迎接父亲，注意到他口袋鼓起' },
        { time: '战后', event: '在父亲帐篷看到印章' },
        { time: '当夜', event: '散步时看到有人挖土，看到迦密走回来' },
        { time: '小城之败后', event: '开始怀疑，不知该如何抉择' }
      ],
      skills: ['观察', '忠诚', '正直']
    },

    // ========== 可选角色（7人起）：喇合之弟 ==========
    {
      id: 'ephraim',
      name: '以法莲',
      title: '喇合之弟',
      description: '喇合的弟弟，随姐姐归化以色列。',
      avatar: '/images/characters/ephraim.svg',
      priority: 7,
      background: `我是喇合的弟弟，因为姐姐保护以色列探子，我们全家得以在城破时存活。

【战前】我对以色列人既感激又恐惧。他们的神真的如此强大吗？

【战中】我和家人躲在姐姐的房子里，听着外面的厮杀声，祈祷能活下来。

【战后】以色列人把我们带出城。我跟着姐姐回王宫找遗物时，看到了一些事情。我看到一个以色列战士从宝库方向跑出来，战袍下藏着东西。我还看到迦勒在宝库里翻找。

【现在】姐姐似乎也看到了什么，但她不愿意说。我们是外邦人，说出来会被相信吗？但如果不说，以色列人会继续遭难。`,
      secret: '我比姐姐看得更清楚——那个从宝库出来的战士，我看到了他的脸，是迦密。但我是外邦人，而且迦密是犹大支派的勇士，谁会相信我的话？姐姐让我不要乱说，但我觉得应该说出真相。',
      goal: '你掌握关键证据，但作为外邦人，你的话可能不被信任。你需要决定是否说出你看到的一切，以及如何让人相信你。',
      relationships: {
        joshua: '救了我们全家的人',
        caleb: '我看到他在宝库里',
        carmi: '我看到他从宝库出来藏东西',
        rahab: '我的姐姐，她让我不要乱说',
        phinehas: '祭司，也许他会相信我'
      },
      timeline: [
        { time: '战前', event: '和家人躲在姐姐家' },
        { time: '战斗中', event: '在房子里等待' },
        { time: '城墙倒塌后', event: '被以色列人救出' },
        { time: '战后', event: '跟姐姐回王宫找遗物' },
        { time: '在王宫附近', event: '看到迦密从宝库出来，战袍藏东西' },
        { time: '稍后', event: '看到迦勒在宝库翻找' }
      ],
      skills: ['观察', '谨慎', '求生']
    },

    // ========== 可选角色（8人起）：约书亚副官 ==========
    {
      id: 'nathan',
      name: '拿单',
      title: '约书亚副官',
      description: '约书亚的副官，负责军务协调。',
      avatar: '/images/characters/nathan.svg',
      priority: 8,
      background: `我是约书亚的副官，负责协调各支派的军务。

【战前】我协助约书亚召开长老会议，传达神的命令。我注意到有些年轻战士听到"当灭之物"时眼中闪过贪婪的光芒。

【战中】我跟随约书亚在北门指挥。战斗很激烈，我无暇顾及其他区域。

【战后】我负责统计伤亡和收集战利品。迦勒的队伍送来的财物数目与预期不符，我向约书亚报告了这件事。我还注意到几个战士的战袍似乎比战前鼓了一些，但战场混乱，我没有深究。

【现在】小城战败后，我开始回想那些细节。我记得迦密和迦勒的战袍都有些异常。但迦勒是德高望重的长老，我不敢轻易指控。`,
      secret: '我在战后清点时，特别注意到迦密的战袍鼓得很明显。我问他怎么回事，他说是受伤包扎了。但我没看到他有任何伤口。另外，我也注意到迦勒口袋里有东西，但他是长老，我不敢追问。',
      goal: '你掌握一些观察到的细节，但涉及到德高望重的迦勒和普通战士迦密。你需要公正地提供证词，不偏袒任何人。',
      relationships: {
        joshua: '我的长官，我要忠实地向他报告',
        caleb: '德高望重的长老，但我注意到他口袋有东西',
        carmi: '年轻战士，战袍鼓起，说是受伤包扎',
        phinehas: '祭司，我向他报告了财物数目不对',
        rahab: '归化者，住在营地边缘'
      },
      timeline: [
        { time: '战前黄昏', event: '协助召开长老会议' },
        { time: '战斗开始', event: '跟随约书亚在北门' },
        { time: '战斗中', event: '协调各支派进攻' },
        { time: '战斗结束', event: '统计伤亡，收集战利品' },
        { time: '清点时', event: '注意到迦密和迦勒战袍异常' },
        { time: '小城之败后', event: '开始回想细节' }
      ],
      skills: ['统筹', '观察', '忠诚']
    },

    // ========== 可选角色（9人起）：基遍人 ==========
    {
      id: 'gibeonite',
      name: '基遍',
      title: '基遍使者',
      description: '来自基遍城的使者，假扮远方来客。',
      avatar: '/images/characters/gibeonite.svg',
      priority: 9,
      background: `我是基遍城的使者。我们听说了以色列人的神如何带领他们攻克坚城，我们非常害怕。

【来意】我们假扮成远方来的旅客，穿着破旧的衣服，带着发霉的饼，来与以色列人立约求和。我们说我们是从很远的地方来的，其实基遍城就在附近。

【在营中】我在以色列营中等候约书亚的接见。在等候期间，我观察到很多事情。我看到有人在夜里偷偷行动，我看到有人在帐篷里藏东西。

【现在】小城战败的消息传来，我意识到以色列人内部出了问题。如果我能帮助他们找出罪人，也许能增加我们立约的筹码。但我也担心，如果他们发现我是骗子，会对我不利。`,
      secret: '我在营地等候时，亲眼看到一个年轻战士在夜里挖土埋东西。我看得很清楚，因为我当时睡不着，在营地边缘散步。那人往犹大支派的方向去了。但我是外人，而且我自己也在欺骗以色列人，我的证词会被相信吗？',
      goal: '你掌握关键证据，但你自己的身份也是假的。你需要决定是否冒险说出真相。如果你的证词帮助找出罪人，可能会赢得以色列人的信任；但如果你的欺骗被揭穿，后果不堪设想。',
      relationships: {
        joshua: '我要与他立约的人，希望他相信我',
        caleb: '以色列的长老，很有威严',
        carmi: '我看到有人埋东西，可能是他',
        phinehas: '祭司，我需要小心他的洞察力',
        rahab: '同样是外邦人，也许能理解我的处境'
      },
      timeline: [
        { time: '数日前', event: '从基遍城出发，假扮远方旅客' },
        { time: '抵达营地', event: '请求与约书亚立约' },
        { time: '等候期间', event: '在营地边缘观察' },
        { time: '那天夜里', event: '看到有人在挖土埋东西' },
        { time: '小城之败后', event: '意识到可以利用这个信息' }
      ],
      skills: ['欺骗', '观察', '外交']
    },

    // ========== 可选角色（10人起）：女先知 ==========
    {
      id: 'deborah',
      name: '底波拉',
      title: '女先知',
      description: '以色列中有恩赐的女先知，能领受异象。',
      avatar: '/images/characters/miriam.svg',
      priority: 10,
      background: `我是以色列中的女先知，神有时会赐给我异象和启示。

【战前】在攻城之战前，我领受了一个异象：我看到有人在黑暗中伸手拿取闪闪发光的东西，然后把它藏在地下。我当时不明白这个异象的意思。

【战后】小城战败后，我又领受了一个异象：我看到一个年轻人站在审判台前，他的脚下是翻动的泥土，他的手中是金银和华美的衣服。

【现在】我相信这些异象与当前的危机有关。但异象往往是隐晦的，我需要更多信息来解读它们。而且，有些人不相信女先知的话，认为只有祭司才能领受神的启示。`,
      secret: '在我的异象中，我看到那个年轻人穿着犹大支派的服饰。我还看到迦勒站在他身边，似乎在为他说情，但最终无济于事。这些细节可能指向特定的人，但我不确定是否应该说出来——万一我解读错了呢？',
      goal: '你的异象可能是破案的关键，但你需要谨慎地分享。你要在合适的时机说出合适的信息，引导众人找到真相，同时也要证明你先知恩赐的真实性。',
      relationships: {
        joshua: '神所拣选的领袖，他应该会重视我的异象',
        phinehas: '祭司，可能会质疑我的恩赐',
        caleb: '信心坚定的长老，异象中他在为那年轻人说情',
        carmi: '犹大支派的年轻人...可能是异象中的那个人？',
        rahab: '归化者，她的信心值得敬佩'
      },
      timeline: [
        { time: '战前', event: '领受第一个异象：有人拿取并藏匿东西' },
        { time: '战斗期间', event: '在营地祈祷' },
        { time: '小城之败后', event: '领受第二个异象：年轻人受审判' },
        { time: '现在', event: '试图解读异象，寻找线索' }
      ],
      skills: ['异象', '属灵洞察', '解梦']
    }
  ],

  phases: [
    {
      id: 'character_introduction',
      name: '角色介绍',
      description: '玩家阅读自己的角色剧本，了解背景、秘密、时间线和人物关系。每位玩家简短介绍自己的公开身份。',
      duration: 10,
      actions: ['read_character', 'introduce_self'],
      tips: '仔细阅读你的秘密和时间线，这些信息在后续阶段会很重要。',
      events: [
        {
          id: 'camp_atmosphere',
          timing: 'start',
          title: '营地气氛',
          narrative: '以色列营地笼罩在一片沉重的气氛中。士兵们三三两两聚在一起低声交谈，不时有人望向约书亚的帐篷。战败的阴影和神离弃的恐惧，让每个人都心神不宁。',
          privateInfo: {
            carmi: '你感到一阵心虚。帐篷下埋着的东西仿佛在灼烧你的心。你必须表现得若无其事。',
            caleb: '你注意到迦密今天格外安静，眼神闪躲。这让你想起战场上他消失的那段时间...'
          }
        }
      ]
    },
    {
      id: 'disaster_announcement',
      name: '灾难宣告',
      description: '约书亚宣布小城战败的消息和神的启示：有人私藏了当灭之物。',
      duration: 10,
      actions: ['hear_announcement', 'initial_reactions'],
      narrative: '三十六位以色列勇士倒在小城的城墙下。约书亚撕裂衣服，俯伏在约柜前。神说："以色列人犯了罪，取了当灭的物，又偷窃，又行诡诈。"罪人必须被找出，否则以色列将无法在迦南立足。',
      events: [
        {
          id: 'joshua_speech',
          timing: 'start',
          title: '约书亚的宣告',
          narrative: '约书亚站在会幕前，面色凝重。他的声音在寂静的营地中回荡："弟兄们，我们在小城的失败不是因为敌人强大，而是因为我们中间有人得罪了神。神已经告诉我——有人私藏了当灭之物！"人群中响起一阵惊呼和窃窃私语。',
          privateInfo: {
            carmi: '你的心跳加速。他知道了？不，他只是知道有人犯罪，不知道是谁。冷静，冷静...',
            rahab: '你想起那天在王宫附近看到的那个战士。现在你知道那意味着什么了。'
          }
        },
        {
          id: 'crowd_reaction',
          timing: 'middle',
          title: '众人的反应',
          narrative: '人群开始骚动。有人大声喊道："是谁？把他揪出来！"也有人紧张地环顾四周，似乎在担心自己会被怀疑。约书亚举手示意安静："神说，明天早晨我们要通过掣签来找出罪人。但在此之前，我希望大家能坦诚相告——谁看到了什么，谁知道什么？"'
        },
        {
          id: 'phinehas_steps_forward',
          timing: 'end',
          title: '非尼哈的发言',
          narrative: '祭司非尼哈走上前来，神情严肃："约书亚，我有些事情必须报告。那天晚上我在营地巡视时，看到了一些异常..."他停顿了一下，目光扫过在场的每一个人。',
          privateInfo: {
            carmi: '他看到了什么？那晚你以为没人注意到...',
            phinehas: '你决定先不说出全部，看看其他人的反应。'
          },
          revealsClues: ['treasury_anomaly']
        }
      ]
    },
    {
      id: 'investigation_round1',
      name: '第一轮调查：回忆战场',
      description: '每位角色回忆并讲述自己在战斗当天的经历。注意其他人的时间线是否有矛盾。',
      duration: 20,
      actions: ['share_timeline', 'ask_questions', 'reveal_or_hide_info'],
      tips: '注意其他角色的时间线是否有矛盾。真凶会试图隐藏或转移注意力。',
      events: [
        {
          id: 'caleb_testimony',
          timing: 'start',
          title: '迦勒的证词',
          narrative: '迦勒站起身来，他的声音沉稳而有力："我带领突击队攻打王宫区域。战斗很激烈，我们的队伍在混战中分散了。"他的目光落在迦密身上，"我记得有人一度消失了一会儿，但战场上这很正常..."',
          privateInfo: {
            carmi: '他在暗示你！你需要想办法解释那段时间你去了哪里。',
            caleb: '你看到迦密的表情变了一下。你的怀疑加深了。'
          }
        },
        {
          id: 'servant_report',
          timing: 'middle',
          title: '意外的报告',
          narrative: '一个仆人匆匆跑来，在约书亚耳边低语了几句。约书亚的脸色变得更加凝重："有人报告说，战斗结束那晚，看到有人在帐篷区域挖土。"全场哗然。',
          privateInfo: {
            carmi: '完了。有人看到了。但他们看清是谁了吗？',
            abel: '你想起那晚你在营地散步时看到的情景...'
          }
        },
        {
          id: 'rahab_hesitation',
          timing: 'end',
          title: '喇合的犹豫',
          narrative: '喇合一直沉默不语，但她的神情显示她知道些什么。约书亚注意到了："喇合，你那天在王宫附近，你看到了什么？"喇合低下头，似乎在犹豫是否要说出真相...',
          privateInfo: {
            rahab: '你看到了那个战士，但你是外邦人，你的话会被相信吗？而且你自己也带出了银盒...',
            carmi: '喇合知道什么？她那天确实在王宫附近。你需要想办法让人怀疑她的动机。'
          }
        }
      ],
      characterActions: [
        {
          id: 'question_timeline',
          name: '追问时间线',
          description: '对某人的时间线提出质疑',
          availableTo: 'all',
          resultNarrative: '你对{target}的时间线提出了质疑，要求他/她详细解释那段时间的去向。'
        },
        {
          id: 'share_observation',
          name: '分享观察',
          description: '公开你观察到的可疑情况',
          availableTo: 'all',
          resultNarrative: '你决定分享你所观察到的情况，这可能会帮助找出真凶，也可能让你成为怀疑对象。'
        },
        {
          id: 'defend_someone',
          name: '为某人辩护',
          description: '站出来为被怀疑的人说话',
          availableTo: 'all',
          resultNarrative: '你站出来为{target}辩护，这可能会转移嫌疑，也可能让人怀疑你们是同谋。'
        }
      ]
    },
    {
      id: 'clue_reveal',
      name: '线索揭示：证人出现',
      description: '关键证人开始提供证词。每个人都有机会公开或隐瞒自己知道的信息。',
      duration: 15,
      actions: ['reveal_clues', 'discuss_evidence', 'confront'],
      cluesRevealed: ['witness_testimony', 'phinehas_observation', 'rahab_knowledge'],
      events: [
        {
          id: 'phinehas_full_testimony',
          timing: 'start',
          title: '非尼哈的完整证词',
          narrative: '非尼哈终于开口了："那天晚上，我在营地巡视时，看到一个年轻人的身影在帐篷区域挖土。天太黑，我没看清脸，但他往犹大支派的方向去了。"他停顿了一下，"而且，清点献给神的财物时，我发现数目不对——王宫宝库的东西少了。"',
          privateInfo: {
            carmi: '他说的就是你。但他没看清脸，还有机会...',
            caleb: '犹大支派...迦密就是犹大支派的。'
          },
          revealsClues: ['phinehas_observation']
        },
        {
          id: 'rahab_speaks',
          timing: 'middle',
          title: '喇合的证词',
          narrative: '喇合终于鼓起勇气开口了："我...我那天在王宫附近看到一个战士从宝库方向出来，他的战袍鼓鼓的，好像藏着什么东西。"她的声音有些颤抖，"我看到他的腰带是深红色的..."',
          privateInfo: {
            carmi: '她看到了！但她没说出名字，也许她没认出你。你需要转移话题，或者让人怀疑她的动机。',
            rahab: '你没有说出你认出了那个人。你还在犹豫...',
            ephraim: '姐姐没有说出全部。你比她看得更清楚——你看到了那个人的脸。'
          },
          revealsClues: ['rahab_knowledge']
        },
        {
          id: 'tension_rises',
          timing: 'end',
          title: '气氛紧张',
          narrative: '证词让营地的气氛更加紧张。有人开始互相指责，有人则沉默不语。约书亚举手示意安静："够了！我们不能互相猜疑。让我们冷静下来，仔细分析这些证词。"',
          privateInfo: {
            carmi: '你需要在混乱中把嫌疑引向别人。迦勒也在王宫区域，喇合是迦南人...',
            caleb: '你注意到迦密在证词公开后变得更加紧张。'
          }
        }
      ]
    },
    {
      id: 'investigation_round2',
      name: '第二轮调查：对质与追问',
      description: '针对线索进行深入讨论。可以对质、追问细节、建立或打破不在场证明。',
      duration: 15,
      actions: ['cross_examine', 'build_case', 'defend'],
      tips: '现在是建立嫌疑人名单的关键时刻。注意谁在转移话题，谁的证词有漏洞。',
      events: [
        {
          id: 'caleb_questioned',
          timing: 'start',
          title: '迦勒被质疑',
          narrative: '有人突然指向迦勒："你也在王宫区域！你是负责那里的人，最有机会接触宝物！"迦勒的脸色变了一下，但很快恢复平静："我确实在那里，但我是在清点财物，确保一切都献给神。"',
          privateInfo: {
            caleb: '你知道自己藏了那枚印章。如果被发现，你的证词就会失去可信度。',
            abel: '父亲的表情变了。你想起在他帐篷里看到的那枚印章...',
            carmi: '好机会！让他们怀疑迦勒！'
          }
        },
        {
          id: 'rahab_accused',
          timing: 'middle',
          title: '喇合被指控',
          narrative: '"等等，"有人说道，"喇合是迦南人，她最了解宝物在哪里。而且她自己承认那天在王宫附近。她会不会才是真正的罪人？"喇合的脸色苍白："我...我只是去找家人的遗物..."',
          privateInfo: {
            rahab: '你确实带出了银盒。如果他们搜查你的东西...',
            carmi: '继续！让他们怀疑喇合！',
            ephraim: '他们在冤枉姐姐。你应该说出你看到的真相吗？'
          }
        },
        {
          id: 'new_witness',
          timing: 'end',
          title: '新证人',
          narrative: '就在争论激烈时，一个声音响起："我有话要说。"所有人都转向声音的来源...',
          privateInfo: {
            nathan: '你决定说出你在清点战利品时观察到的情况。',
            ephraim: '你鼓起勇气，准备说出你看到的那个人的脸。',
            gibeonite: '你犹豫着要不要说出你在营地边缘看到的一切。'
          },
          unlocksActions: ['reveal_secret_witness']
        }
      ],
      characterActions: [
        {
          id: 'confront_suspect',
          name: '当面对质',
          description: '直接质问你怀疑的人',
          availableTo: 'all',
          resultNarrative: '你当面质问{target}，要求他/她解释疑点。'
        },
        {
          id: 'reveal_secret',
          name: '揭露秘密',
          description: '公开你一直隐瞒的秘密',
          availableTo: 'all',
          resultNarrative: '你决定公开你一直隐瞒的秘密。这可能会帮助找出真凶，也可能让你陷入麻烦。',
          oneTime: true
        },
        {
          id: 'search_request',
          name: '请求搜查',
          description: '请求约书亚搜查某人的帐篷',
          availableTo: 'all',
          condition: '需要约书亚同意',
          resultNarrative: '你请求搜查{target}的帐篷。约书亚考虑了一下...'
        }
      ]
    },
    {
      id: 'crisis_moment',
      name: '危机时刻',
      description: '调查陷入僵局，众人争论不休。约书亚必须做出决定。',
      duration: 10,
      events: [
        {
          id: 'deadlock',
          timing: 'start',
          title: '僵局',
          narrative: '调查陷入僵局。迦勒、喇合、迦密都有嫌疑，但都没有确凿证据。营地中的气氛越来越紧张，有人甚至开始互相推搡。'
        },
        {
          id: 'divine_sign',
          timing: 'middle',
          title: '神的记号',
          narrative: '突然，天空中出现了异象——一道光芒划过天际，落在营地的某个方向。非尼哈惊呼："这是神的指引！神在告诉我们罪人的方向！"所有人都望向那个方向——那是犹大支派的帐篷区。',
          privateInfo: {
            carmi: '神在指向你的方向！你感到一阵恐惧。但也许...也许还有机会...',
            caleb: '犹大支派...迦密就住在那边。',
            phinehas: '神已经显明了。现在需要用掣签来确认。'
          }
        },
        {
          id: 'joshua_decision',
          timing: 'end',
          title: '约书亚的决定',
          narrative: '约书亚站起身来，声音坚定："够了。神已经给了我们指引。现在，每个人都有机会做最后的陈述。之后，我们将进行投票，然后用掣签来验证神的旨意。"'
        }
      ]
    },
    {
      id: 'accusation',
      name: '指控阶段',
      description: '每位玩家可以正式指控一名嫌疑人，并陈述理由。被指控者有机会为自己辩护。',
      duration: 15,
      actions: ['make_accusation', 'state_reasons', 'defend_self'],
      tips: '指控需要有理有据。但要注意，真凶可能也在指控别人来转移嫌疑。',
      events: [
        {
          id: 'final_statements',
          timing: 'start',
          title: '最后陈述',
          narrative: '约书亚环顾四周："现在，每个人轮流发言。你可以指控你认为的罪人，也可以为自己辩护。说出你的理由。"'
        },
        {
          id: 'carmi_defense',
          timing: 'middle',
          title: '迦密的辩护',
          narrative: '轮到迦密发言时，他站起身来，尽量让自己的声音平稳："我是犹大支派的勇士，我跟随迦勒冲锋陷阵。是的，战斗中我们分散了，但那是因为战场混乱。我没有私藏任何东西！"他的目光扫过众人，"倒是有些人，一直在王宫附近徘徊，对宝物了如指掌..."',
          privateInfo: {
            carmi: '你必须把嫌疑引向别人。迦勒、喇合，他们都有可疑之处。',
            rahab: '他在暗示你。你知道真相，但你敢说出来吗？',
            caleb: '他在转移话题。你越来越确定他就是罪人。'
          }
        }
      ]
    },
    {
      id: 'final_vote',
      name: '最终投票',
      description: '所有玩家投票选出最可疑的人。得票最多者将接受掣签验证。',
      duration: 5,
      actions: ['cast_vote'],
      tips: '这是你们的推理结果。投票后将进行掣签，揭示神的旨意。',
      events: [
        {
          id: 'vote_tension',
          timing: 'start',
          title: '投票前的紧张',
          narrative: '约书亚拿出投票用的石子："每人一票，投给你认为最可疑的人。记住，这不仅关乎一个人的命运，更关乎整个以色列的未来。"'
        }
      ]
    },
    {
      id: 'lot_casting',
      name: '掣签验证',
      description: '祭司非尼哈进行掣签。掣签将揭示被投票选中之人是否为真凶。',
      duration: 10,
      actions: ['perform_lot_casting', 'reveal_result'],
      narrative: '非尼哈站在约柜前，手持乌陵和土明。全以色列人屏息凝神，等待神的审判...',
      mechanics: {
        type: 'verification',
        description: '掣签验证投票结果。如果被选中的人是真凶（迦密），掣签显示"有罪"；否则显示"无罪"。'
      },
      events: [
        {
          id: 'lot_ceremony',
          timing: 'start',
          title: '掣签仪式',
          narrative: '非尼哈走到约柜前，高举乌陵和土明。他的声音庄严而洪亮："耶和华以色列的神啊，求你显明你的旨意。这人是否就是那个犯罪的人？"'
        },
        {
          id: 'lot_result',
          timing: 'end',
          title: '掣签结果',
          narrative: '乌陵和土明落下，非尼哈俯身查看，然后缓缓站起身来。全场鸦雀无声，等待他宣布结果...'
        }
      ]
    },
    {
      id: 'judgment',
      name: '审判结局',
      description: '根据掣签结果，揭示完整真相，宣布游戏结果。',
      duration: 5,
      actions: ['reveal_truth', 'show_ending'],
      endings: {
        correct: '迦密在神的审判下无处遁形，他承认了自己的罪行："我实在得罪了耶和华以色列的神..."以色列人从他帐篷下挖出了华美衣服、银子和金饰。神的怒气转消，以色列重新得到神的同在。',
        wrong: '掣签显示此人无罪。以色列陷入更深的困惑，真正的罪人仍逍遥法外。神的怒气继续临到以色列...'
      },
      events: [
        {
          id: 'correct_ending',
          timing: 'end',
          title: '真相大白',
          narrative: '迦密的脸色惨白，他知道无法再隐瞒了。在众人的注视下，他跪倒在地："我...我实在得罪了耶和华以色列的神。我看见那华美的衣服、银子和金饰，心里起了贪念...它们现在埋在我帐篷下面..."',
          privateInfo: {
            carmi: '一切都结束了。你的贪婪让三十六个弟兄丧命，让整个以色列蒙羞。'
          }
        }
      ]
    }
  ],

  clues: [
    {
      id: 'divine_revelation',
      name: '神的启示',
      description: '约书亚从神那里得到的启示。',
      type: 'testimony',
      icon: '✨',
      discovered: true, // 游戏开始时公开
      content: '以色列人犯了罪，违背了我所吩咐他们的约，取了当灭的物；又偷窃，又行诡诈，又把那当灭的物放在自己的家具里。',
      revealPhase: 'disaster_announcement'
    },
    {
      id: 'witness_testimony',
      name: '目击证词',
      description: '有人在夜间看到的情况。',
      type: 'testimony',
      icon: '👁️',
      discovered: false,
      content: '有人看到一个战士在城破后的夜晚，偷偷在帐篷附近挖土。天太黑了，没看清是谁，但那人往犹大支派的方向去了。',
      revealPhase: 'clue_reveal',
      owner: 'phinehas'
    },
    {
      id: 'phinehas_observation',
      name: '祭司的观察',
      description: '非尼哈在营地巡视时的观察。',
      type: 'testimony',
      icon: '🔍',
      discovered: false,
      content: '那天晚上我在营地巡视，看到有人在帐篷区域挖土。天太黑，我只看到是个年轻人的身影，往犹大支派的方向去了。',
      revealPhase: 'clue_reveal',
      owner: 'phinehas'
    },
    {
      id: 'rahab_knowledge',
      name: '喇合的情报',
      description: '喇合对城中宝物的了解。',
      type: 'testimony',
      icon: '💎',
      discovered: false,
      content: '国王有三件最珍贵的宝物：一件华美的外邦衣服、一袋银子和一块金饰。城破时，这些宝物应该被献给神。我在王宫附近看到一个战士从宝库方向出来，战袍鼓鼓的，他的腰带是深红色的。',
      revealPhase: 'clue_reveal',
      owner: 'rahab'
    },
    {
      id: 'caleb_observation',
      name: '迦勒的观察',
      description: '迦勒对战斗中情况的观察。',
      type: 'testimony',
      icon: '⚔️',
      discovered: false,
      content: '在王宫区域的战斗中，我的队伍分散了。我注意到迦密有一段时间消失了，后来他回来时，战袍似乎比之前鼓了一些。但战场混乱，我不能确定。',
      revealPhase: 'investigation_round1',
      owner: 'caleb',
      reliability: '迦勒自己也在王宫区域，且私留了一枚印章'
    },
    {
      id: 'treasury_anomaly',
      name: '宝库异常',
      description: '王宫宝库的异常情况。',
      type: 'scene',
      icon: '🏛️',
      discovered: false,
      content: '迦勒报告说，王宫宝库被翻动过，有些东西似乎遗失了。清点献给神的财物时，发现数目不对。',
      revealPhase: 'disaster_announcement'
    },
    {
      id: 'disturbed_earth',
      name: '翻动的泥土',
      description: '某个帐篷里有新翻动过的泥土痕迹。',
      type: 'scene',
      icon: '🕳️',
      discovered: false,
      content: '如果有人去检查迦密的帐篷，会发现地面有一处明显被翻动过的痕迹，泥土颜色与周围不同。',
      revealPhase: 'lot_casting', // 只有掣签后才能搜查
      condition: '需要掣签指向迦密后才能搜查帐篷'
    },
    {
      id: 'foreign_garment',
      name: '华美衣服',
      description: '一件来自外邦的华美衣服。',
      type: 'object',
      icon: '👘',
      discovered: false,
      content: '这是一件极其华美的外邦衣服，上面绣着精美的图案，曾属于国王。',
      revealPhase: 'judgment',
      condition: '从迦密帐篷下挖出'
    },
    {
      id: 'silver_pieces',
      name: '银子',
      description: '一袋银子。',
      type: 'object',
      icon: '🪙',
      discovered: false,
      content: '一袋银子，约等于一个普通人好几年的收入。这些银子来自城中的宝库。',
      revealPhase: 'judgment',
      condition: '从迦密帐篷下挖出'
    },
    {
      id: 'gold_ornament',
      name: '金饰',
      description: '一块精美的金饰。',
      type: 'object',
      icon: '🥇',
      discovered: false,
      content: '一块精美的金饰，纯度极高，显然是从城中的宝库中取出的。',
      revealPhase: 'judgment',
      condition: '从迦密帐篷下挖出'
    },
    {
      id: 'caleb_seal',
      name: '迦勒的印章',
      description: '迦勒私留的国王印章。',
      type: 'object',
      icon: '💍',
      discovered: false,
      content: '一枚国王的印章，迦勒私下留作纪念。这不是"当灭之物"（金银铜铁），但会影响迦勒证词的可信度。',
      revealPhase: 'investigation_round2',
      owner: 'caleb',
      note: '如果迦勒被追问或被指控，他可能会承认此事'
    },
    {
      id: 'rahab_box',
      name: '喇合的银盒',
      description: '喇合从城中带出的母亲遗物。',
      type: 'object',
      icon: '📦',
      discovered: false,
      content: '一个小银盒，里面是喇合母亲的首饰。这不是"当灭之物"，只是普通的家传物品。',
      revealPhase: 'investigation_round2',
      owner: 'rahab',
      note: '如果喇合被追问或被指控，她可能会承认此事'
    },
    {
      id: 'nathan_observation',
      name: '副官的观察',
      description: '拿单在清点战利品时的观察。',
      type: 'testimony',
      icon: '📝',
      discovered: false,
      content: '在清点战利品时，我注意到迦密的战袍鼓得很明显。我问他怎么回事，他说是受伤包扎了。但我没看到他有任何伤口。',
      revealPhase: 'investigation_round2',
      owner: 'nathan',
      note: '8人以上游戏时可用'
    },
    {
      id: 'ephraim_testimony',
      name: '以法莲的证词',
      description: '喇合弟弟的目击证词。',
      type: 'testimony',
      icon: '👀',
      discovered: false,
      content: '我跟姐姐回王宫找遗物时，看到一个战士从宝库出来，战袍下藏着东西。我看清了他的脸——是迦密。',
      revealPhase: 'investigation_round2',
      owner: 'ephraim',
      note: '7人以上游戏时可用'
    }
  ],

  storyline: [
    '以色列人在约书亚的带领下，奇迹般地攻克了迦南坚城。城墙倒塌，以色列人冲入城中。',
    '神吩咐以色列人，城中的一切都要毁灭，金银铜铁要归入耶和华的库中，任何人不得私藏。',
    '然而，有人违背了神的命令，私藏了当灭之物。',
    '以色列人信心满满地进攻附近的小城，却遭遇惨败，三十六人战死。',
    '约书亚撕裂衣服，俯伏在约柜前祷告。神告诉他，以色列中有人犯了罪。',
    '神说：以色列人犯了罪，取了当灭的物，又偷窃，又行诡诈。',
    '神指示约书亚，要通过掣签从支派到宗族到家室到个人，找出罪人。',
    '约书亚召集全以色列人，宣布了神的话，开始寻找罪人的过程。'
  ],

  // 迷惑性设计：每个角色都有可疑之处
  suspicionMatrix: {
    carmi: {
      level: 'high',
      evidence: ['在王宫区域消失过', '战袍鼓起', '有人看到他从宝库出来'],
      counterEvidence: ['战场混乱人人都可能消失', '说是受伤包扎']
    },
    caleb: {
      level: 'medium',
      evidence: ['负责王宫区域', '私留印章', '在宝库附近', '最有机会接触宝物', '儿子也在营地徘徊'],
      counterEvidence: ['四十年忠心', '印章不是当灭之物', '主动报告异常']
    },
    rahab: {
      level: 'medium',
      evidence: ['迦南人', '在王宫附近徘徊', '带出银盒', '最了解宝物', '弟弟也在场'],
      counterEvidence: ['银盒是遗物非当灭之物', '她的情报帮助以色列', '她有信仰动机']
    },
    abel: {
      level: 'low',
      evidence: ['那晚在营地徘徊', '看到父亲藏印章却没报告', '可能替父亲隐瞒'],
      counterEvidence: ['没有参战', '没有机会接触宝物']
    },
    ephraim: {
      level: 'low',
      evidence: ['外邦人', '和姐姐一起在王宫附近', '可能和姐姐合谋'],
      counterEvidence: ['没有参战', '主动提供证词']
    },
    nathan: {
      level: 'low',
      evidence: ['负责清点财物', '最先知道遗失', '可能监守自盗'],
      counterEvidence: ['一直跟随约书亚', '没有机会单独行动']
    },
    phinehas: {
      level: 'none',
      evidence: [],
      counterEvidence: ['祭司身份', '没有参战', '得到神的指示']
    },
    joshua: {
      level: 'none',
      evidence: [],
      counterEvidence: ['领袖身份', '在北门指挥', '向神祷告得启示']
    }
  },

  // 掣签机制
  lotCastingMechanism: {
    description: '掣签是最终验证手段，不是推理工具。玩家需要通过调查和投票选出嫌疑人，然后用掣签确认。',
    process: [
      '1. 玩家进行调查和讨论',
      '2. 玩家投票选出最可疑的人',
      '3. 祭司对被选中者进行掣签',
      '4. 掣签结果揭示此人是否为真凶'
    ],
    outcomes: {
      correct: '掣签显示"有罪"，真相大白，游戏胜利',
      wrong: '掣签显示"无罪"，可选择进入加时调查或游戏失败'
    }
  },

  // 游戏规则
  rules: {
    voting: '每人一票，票数最多者接受掣签验证。平票时由约书亚决定。',
    secrets: '玩家可以选择隐瞒或公开自己的秘密信息。',
    lying: '真凶可以撒谎，其他玩家应该说真话但可以隐瞒。',
    lotCasting: '掣签结果由系统根据真凶身份自动判定，保证公正。'
  }
};
