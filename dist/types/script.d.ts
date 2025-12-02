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
}
export interface Clue {
    id: string;
    name: string;
    description: string;
    type: 'document' | 'testimony' | 'object' | 'scene';
    icon: string;
    discovered: boolean;
    content?: string;
}
export interface ScriptPhase {
    id: string;
    name: string;
    description: string;
    duration?: number;
    actions?: string[];
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
