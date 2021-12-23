declare module Hook{
   export function useState<T>(initial:T):[T,(action:(oldState:T)=>T|T)=>void]
}