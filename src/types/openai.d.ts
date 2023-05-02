export interface FetchGptModelResponse {
    models: Model[]
}

export interface Model {
    slug: string
    max_tokens: number
    title: string
    description: string
    tags: any[]
    qualitative_properties: QualitativeProperties
}

export interface QualitativeProperties {
    reasoning: number[]
    speed: number[]
    conciseness: number[]
}

export interface FetchSessionResponse {
    user: User
    expires: Date
    accessToken: string
    authProvider: string
}

export interface User {
    id: string
    name: string
    email: string
    image: string
    picture: string
    idp: string
    iat: number
    mfa: boolean
    groups: any[]
    intercom_hash: string
}

export interface AskChatGptParams {
    context: string
    target: string
    uuids: Array<string>
}
