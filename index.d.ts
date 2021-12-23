//type,interface可以不加declare 其他如变量，函数，模块，枚举必须加declare关键字
/// <reference path="./Hook.d.ts" />
interface ReactElement {
    type:string|FunctionComponentConstructor,
    props:{
        children:ReactElement[],
        key?:string|number
        [index:string]:any
    },
}
interface FunctionComponentConstructor{
    (props:object):ReactElement,
    isMemorized?:boolean,
    isSameProps?:(oldProps:object,newProps:object)=>boolean
}

interface fiber {
    type:string|FunctionComponentConstructor,
    props:{
        children:ReactElement[],
        key?:string|number
        [index:string]:any
    },
    effectTag:Effect
    old:fiber|null
    child:fiber|null,
    sibling:fiber|null,
    parent:fiber|null,
    dom:HTMLElement|Text,
    insertBefore?:Node, //commitWork阶段通过这个字段添加新dom
    hooks?:object[], //函数组件状态等钩子
}
declare enum Effect {
    PLACEMENT,UPDATE,DELETION,SKIP //增，改，删
}

declare class FiberScheduler {
    private currentRootFiber:fiber
    private nextUnitWork:fiber
    private deletions:fiber[]
    private unitWorkTime:number
    constructor(rootFiber:fiber)
    setUpdateWork(work:fiber):void
    getCurrentRootFiber():fiber
    private createDom(fiber:fiber):void
    private updateHostComponent(fiber:fiber):void
    private updateFunctionComponent(fiber:fiber):void
    private performUnitWork(fiber:fiber):fiber
    private reconcileChildren(parentFiber:fiber,elements:ReactElement[]):void
    private commitWork(rootFiber:fiber):void
    private updateDom(fiber:fiber,oldFiber:fiber,dom:Node):void
    private workLoop:(deadline:IdleDeadline)=>void
    start():void
}

type action<T>={(oldState:T):T}|T
type setState<T>=(action:action<T>)=>void
type useState<T>=(initial:T)=>[T,setState<T>]
