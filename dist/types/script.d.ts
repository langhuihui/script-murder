export interface Character {
    id: string;
    name: string;
    title: string;
    description: string;
    avatar: string;
    background: string;
    secret?: string;
    goal: string;
    skills?: string[];
    /** 与其他角色的关系 */
    relationships?: Record<string, string>;
    /** 角色时间线 */
    timeline?: Array<{
        time: string;
        event: string;
    }>;
    /** 可用的不在场证明 */
    alibis?: string[];
    /** 角色优先级，用于按人数分配角色 */
    priority?: number;
}
export interface Clue {
    id: string;
    name: string;
    description: string;
    type: 'document' | 'testimony' | 'object' | 'scene';
    icon: string;
    discovered: boolean;
    content?: string;
    /** 在哪个阶段揭示 */
    revealPhase?: string;
    /** 线索所有者（哪个角色知道） */
    owner?: string;
    /** 线索可信度说明 */
    reliability?: string;
    /** 获取条件 */
    condition?: string;
    /** 备注 */
    note?: string;
}
export interface ScriptPhase {
    id: string;
    name: string;
    description: string;
    duration?: number;
    actions?: string[];
    /** 阶段提示 */
    tips?: string;
    /** 阶段叙事文本 */
    narrative?: string;
    /** 本阶段揭示的线索ID列表 */
    cluesRevealed?: string[];
    /** 阶段特殊机制 */
    mechanics?: {
        type: string;
        description: string;
    };
    /** 结局文本（用于最终阶段） */
    endings?: {
        correct: string;
        wrong: string;
    };
    /** 剧情事件：在该阶段中发生的事件 */
    events?: StoryEvent[];
    /** 可执行的角色行动 */
    characterActions?: CharacterAction[];
}
/** 剧情事件 */
export interface StoryEvent {
    id: string;
    /** 事件触发时机：'start' | 'middle' | 'end' | 'triggered' */
    timing: 'start' | 'middle' | 'end' | 'triggered';
    /** 触发条件（可选，用于 triggered 类型） */
    trigger?: {
        type: 'time' | 'action' | 'vote' | 'clue_found';
        condition: string;
    };
    /** 事件标题 */
    title: string;
    /** 事件叙述（所有人可见） */
    narrative: string;
    /** 对特定角色的私密信息 */
    privateInfo?: Record<string, string>;
    /** 事件后揭示的线索 */
    revealsClues?: string[];
    /** 事件后解锁的行动 */
    unlocksActions?: string[];
}
/** 角色可执行的行动 */
export interface CharacterAction {
    id: string;
    name: string;
    description: string;
    /** 哪些角色可以执行此行动 */
    availableTo: string[] | 'all';
    /** 执行条件 */
    condition?: string;
    /** 行动结果叙述 */
    resultNarrative: string;
    /** 行动可能揭示的线索 */
    revealsClues?: string[];
    /** 行动对其他角色的影响 */
    effects?: Record<string, string>;
    /** 是否只能执行一次 */
    oneTime?: boolean;
}
export interface GameScript {
    id: string;
    title: string;
    description: string;
    maxPlayers: number;
    minPlayers: number;
    estimatedTime: number;
    difficulty: 'easy' | 'medium' | 'hard';
    characters: Character[];
    phases: ScriptPhase[];
    clues: Clue[];
    storyline: string[];
    /** 真凶角色ID */
    culpritId?: string;
    /** 角色配置：根据人数分配 */
    characterConfig?: {
        required: string[];
        optional: Array<{
            minPlayers: number;
            characterId: string;
        }>;
    };
    /** 嫌疑矩阵：每个角色的可疑程度和证据 */
    suspicionMatrix?: Record<string, {
        level: 'none' | 'low' | 'medium' | 'high';
        evidence: string[];
        counterEvidence: string[];
    }>;
    /** 掣签/验证机制 */
    lotCastingMechanism?: {
        description: string;
        process: string[];
        outcomes: {
            correct: string;
            wrong: string;
        };
    };
    /** 游戏规则 */
    rules?: Record<string, string>;
    /**
     * 剧本主题样式配置
     */
    theme?: {
        /**
         * CSS 文件路径（相对于 scripts 目录或绝对路径）
         */
        cssPath?: string;
        /**
         * 内联 CSS 样式（可选，如果提供了 cssPath 则优先使用 cssPath）
         */
        inlineCSS?: string;
        /**
         * 主题颜色配置
         */
        colors?: {
            primary?: string;
            secondary?: string;
            background?: string;
            text?: string;
            accent?: string;
        };
        /**
         * 背景图片或渐变
         */
        background?: string;
        /**
         * 字体配置
         */
        fontFamily?: string;
    };
}
export interface ScriptSummary {
    id: string;
    title: string;
    description: string;
    maxPlayers: number;
    minPlayers: number;
    estimatedTime: number;
    difficulty: 'easy' | 'medium' | 'hard';
}
