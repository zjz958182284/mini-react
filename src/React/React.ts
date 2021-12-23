/**
 * memo k hook(useState)
 */

import {initialHookVars,initialHookFiberScheduler} from './Hook'

const Effect={
    PLACEMENT:0x1,//增
    UPDATE:0x2,//改
    DELETION:0x3,//删
    SKIP:0x4 //跳过执行单位任务和提交任务阶段
}

class FiberScheduler  {
    private currentRootFiber:fiber=null
    private nextUnitWork:fiber=null
    private deletions:fiber[]=[]
    private unitWorkTime:number=1
    public setUpdateWork(work:fiber):void{
        this.nextUnitWork=work
        this.currentRootFiber=work   
    }
    public getCurrentRootFiber(){
        return this.currentRootFiber
    }
    private createDom(fiber:fiber){
        const dom = fiber.type!=='TextElement'?document.createElement(fiber.type as string):
                    document.createTextNode(fiber.props.nodeValue)
        for(const [prop,value] of Object.entries(fiber.props)){
            if(prop!=='children') {
                if(prop.startsWith('on')) 
                    dom.addEventListener(prop.substring(2).toLowerCase(),value)
                else dom[prop]=value
            }
        }
            
        return dom
    }
    private updateHostComponent(fiber:fiber){
        if(!fiber.dom) fiber.dom=this.createDom(fiber)
        this.reconcileChildren(fiber,fiber.props.children)
    }
    private updateFunctionComponent(fiber:fiber){
        if(!fiber.hooks) fiber.hooks=[]
        initialHookVars(fiber,0)
        this.reconcileChildren(fiber,[(fiber.type as FunctionComponentConstructor)(fiber.props)])
    }
    private performUnitWork(fiber:fiber):fiber{
        let fiberThatHasSibling:fiber=fiber
        while(fiberThatHasSibling!==this.currentRootFiber&&!fiberThatHasSibling.sibling)
            fiberThatHasSibling=fiberThatHasSibling.parent
        if(fiber.effectTag!==Effect.SKIP) {
            const isFunctionComponent=typeof fiber.type === 'function'
            if(isFunctionComponent) this.updateFunctionComponent(fiber)
            else this.updateHostComponent(fiber)
            if(fiber.child) return fiber.child
            if(fiberThatHasSibling!==this.currentRootFiber) return fiberThatHasSibling.sibling
            return null 
        }else{
            if(fiberThatHasSibling!==this.currentRootFiber) return fiberThatHasSibling.sibling
            return null 
        }        
    }
    private reconcileChildren(parentFiber:fiber,elements:ReactElement[]){
        let oldFiber=parentFiber.old?.child
        let oldHostFibers:fiber[]=[]
        let keyFiberMap:Map<string|number,fiber>=new Map()
        let functionFiberMap:Map<Function,fiber[]>=new Map
        const findHostDom=(fiber:fiber):Node=>{
            let hostFiber=fiber
            while(typeof hostFiber.type==='function')
                hostFiber=hostFiber.child
            return hostFiber.dom
        }
        let p:fiber=oldFiber
        while(p){
            //新元素有key但是不在keyFiberMap中的一律视为placement元素
            if(p.props.key) keyFiberMap.set(p.props.key,p)
            else if(typeof p.type==='function'){
                if(functionFiberMap.has(p.type)) functionFiberMap.get(p.type).push(p)
                else functionFiberMap.set(p.type,[p])
            }else oldHostFibers.push(p)
            p=p.sibling
        }
        //diff
        let head:fiber=null,tail:fiber=null
        let newStartIdx=0,newEndIdx=elements.length-1,
            oldStartIdx=0,oldEndIdx=oldHostFibers.length-1
        let placementFiberStack:fiber[]=[],tailUpdateFiberDom:Node=null
        while(newStartIdx<=newEndIdx||oldStartIdx<=oldEndIdx){
            if(newStartIdx>newEndIdx) break
            let newFiber:fiber={
                type: null,
                props: null,
                old: null,
                child: null,
                sibling: null,
                parent: parentFiber,
                dom: null,
                effectTag:null,
            }
            //新element与旧fiber比对需要尽可能地相似 
            let old:fiber=null,effectTag=Effect.UPDATE,newFiberAppendDirection:'head'|'tail'='head'
            //注意头尾都有可能是key或者function节点
            const newStart=elements[newStartIdx]
            const newEnd=elements[newEndIdx]
            const isKeyOrFunctionElement=(el:ReactElement)=>el.props.key||typeof el.type==='function'
            const flagS=isKeyOrFunctionElement(newStart)
            const flagE=isKeyOrFunctionElement(newEnd)
            if(flagS||flagE){
                const handleKeyOrFunctionElement=(el:ReactElement,direction: 'head'|'tail')=>{
                    if(el.props.key){
                        if(keyFiberMap.has(el.props.key)){
                            old=keyFiberMap.get(el.props.key)
                            if(typeof el.type==='function'&&el.type.isMemorized&&
                            el.type.isSameProps(old.props,el.props)) 
                                effectTag=Effect.SKIP
                            keyFiberMap.delete(el.props.key)
                        }else effectTag=Effect.PLACEMENT
                    }else if(typeof el.type==='function'){
                        if(functionFiberMap.has(el.type)&&functionFiberMap.get(el.type).length>0){
                            old=direction==='head'?functionFiberMap.get(el.type).shift()
                                :functionFiberMap.get(el.type).pop()
                            if(el.type.isMemorized&&el.type.isSameProps(old.props,el.props))
                                effectTag=Effect.SKIP
                        }else effectTag=Effect.PLACEMENT
                    }         
                }
                if(flagS){
                    handleKeyOrFunctionElement(newStart,newFiberAppendDirection)
                    newStartIdx++
                }else{
                    newFiberAppendDirection='tail'
                    handleKeyOrFunctionElement(newEnd,newFiberAppendDirection)
                    newEndIdx--
                }
            }
            else{
                //借鉴VUE diff算法
                if(oldStartIdx<=oldEndIdx){
                    const oldStart=oldHostFibers[oldStartIdx]
                    const oldEnd=oldHostFibers[oldEndIdx]
                    if(oldStart.type===newStart.type){ //头头相似
                        old=oldStart
                        oldStartIdx++
                        newStartIdx++
                    }else if(newEnd.type===oldEnd.type){ //尾尾相似
                        old=oldEnd
                        newFiberAppendDirection='tail'
                        oldEndIdx--
                        newEndIdx--
                    }else if(oldStart.type===newEnd.type){//头尾相似
                        old=oldStart
                        newFiberAppendDirection='tail'
                        oldStartIdx++
                        newEndIdx--
                    }else if(oldEnd.type===newStart.type){ //尾头相似
                        old=oldEnd
                        oldEndIdx--
                        newStartIdx++
                    }else{
                        effectTag=Effect.PLACEMENT
                        newStartIdx++
                    }
                }else{
                    effectTag=Effect.PLACEMENT
                    newStartIdx++
                }    
            }
            //根据新fiber附加方向
            if(newFiberAppendDirection==='head'){
                if(!head){
                    head=newFiber
                    parentFiber.child=head
                }else{
                    head.sibling=newFiber
                    head=newFiber
                }
            }else{
                newFiber.sibling=tail
                tail=newFiber
            }
            //根据fiber不同tag添加不同属性
            const el=newFiberAppendDirection==='head'?newStart:newEnd
            newFiber.type=el.type
            newFiber.props=el.props
            newFiber.effectTag=effectTag
            if(effectTag===Effect.UPDATE){
                newFiber.old=old
                newFiber.dom=old.dom
                newFiber.hooks=old.hooks
            }else if(effectTag===Effect.PLACEMENT){
                if(newFiberAppendDirection==='head')
                    placementFiberStack.push(newFiber)
                else newFiber.insertBefore=tailUpdateFiberDom
            }else if(effectTag===Effect.SKIP){
                newFiber.child=old.child
                newFiber.child.parent=newFiber
                newFiber.hooks=old.hooks
            }
            //为每一个新增节点添加相对位置
            if(effectTag===Effect.UPDATE||effectTag===Effect.SKIP){
                let hostDom=effectTag===Effect.UPDATE?findHostDom(newFiber.old)
                :findHostDom(newFiber.child)
                if(newFiberAppendDirection==='head')
                    while(placementFiberStack.length)
                        //小心functionFiber的嵌套
                        placementFiberStack.pop().insertBefore=hostDom       
                else tailUpdateFiberDom=hostDom
            }
        }
        //剩余全部为待删除节点
        if(newStartIdx>newEndIdx){
            while(oldStartIdx<=oldEndIdx){
                this.deletions.push(oldHostFibers[oldStartIdx])
                oldStartIdx++
            }
        }
        this.deletions.push(...Array.from(keyFiberMap.values()))
        for(const v of functionFiberMap.values())
            if(v.length>0) this.deletions.push(...v)
        this.deletions.forEach(f=>f.effectTag=Effect.DELETION)
        //连接头尾
        if(head) {
            while(placementFiberStack.length)
                placementFiberStack.pop().insertBefore=tailUpdateFiberDom
            head.sibling=tail
        }
        //连接尾部
        else if(tail) parentFiber.child=tail
        else parentFiber.child=null
    }
    private commitWork(rootFiber:fiber):void{
        function findParentDom(fiber:fiber):Node{
            while(fiber.parent&&!fiber.parent.dom) fiber=fiber.parent
            return fiber.parent?.dom
        }
        function findHostDom(fiber:fiber):Node{
            let hostFiber=fiber
            while(typeof hostFiber.type==='function')
                hostFiber=hostFiber.child
            return hostFiber.dom
        }
        //小心functionFiber层层嵌套 functionFiber没有dom
        const commit=(fiber:fiber):void=>{
            if(!fiber) return
            if(fiber.effectTag===Effect.SKIP) {
                fiber.effectTag=Effect.UPDATE //返回默认tag
                commit(fiber.sibling)
                return  
            }
            if(fiber.effectTag===Effect.DELETION) {
                const parentDom=findParentDom(fiber)
                const hostDom=findHostDom(fiber)
                parentDom.removeChild(hostDom)
                return
            }
            if(!(typeof fiber.type==='function')){
                //添加hostFiberDom
                if(fiber.effectTag===Effect.PLACEMENT){
                    const parentDom=findParentDom(fiber)
                    if(typeof fiber.parent.type!=='function'){
                        if(fiber.insertBefore) 
                            parentDom.insertBefore(fiber.dom,fiber.insertBefore)
                        else parentDom.appendChild(fiber.dom)
                    }
                //更新dom
                }else if(fiber.effectTag===Effect.UPDATE){
                    this.updateDom(fiber,fiber.old,fiber.dom)
                }
                //调整现有dom的顺序
                let updateChildren:Node[]=[]
                for(let child=fiber.child;child;child=child.sibling){
                    if(child.effectTag===Effect.UPDATE||child.effectTag===Effect.SKIP){
                        if(typeof child.type==='function'){
                            updateChildren.push(findHostDom(child))
                        }else updateChildren.push(child.dom)
                    }
                }
                for(let i=updateChildren.length-2;i>=0;--i)
                    if(updateChildren[i].nextSibling!==updateChildren[i+1])
                        fiber.dom.insertBefore(updateChildren[i],updateChildren[i+1])
                updateChildren=[]
            }else {
                //添加functionFiberDom
                if(fiber.effectTag===Effect.PLACEMENT&&typeof fiber.parent.type!=='function'){
                    const parentDom=findParentDom(fiber)
                    const hostChildDom=findHostDom(fiber)
                    if(fiber.insertBefore)
                        parentDom.insertBefore(hostChildDom,fiber.insertBefore)
                    else parentDom.appendChild(hostChildDom)
                }
                fiber.old=null
                fiber.effectTag=Effect.UPDATE //重置为初始tag 
            }
            commit(fiber.child)
            commit(fiber.sibling)
        }
        //删除dom
        this.deletions.forEach(f=>commit(f))
        this.deletions=[]
         //对dom进行增,改和调整相对顺序
        commit(rootFiber)
    }
    private updateDom(fiber:fiber,oldFiber:fiber,dom:Node):void{
        const newProps=fiber.props,oldProps=oldFiber.props
        //添加新属性
        Object.keys(newProps).forEach(k=>{
            if(k!=='children'&&(!oldProps[k]||oldProps[k]!==newProps[k])){
                if(k.startsWith('on')){
                    dom.removeEventListener(k.substring(2).toLowerCase(),oldProps[k])
                    dom.addEventListener(k.substring(2).toLowerCase(),newProps[k])
                } 
                else dom[k]=newProps[k]
            }       
        })
        //移除旧属性
        Object.keys(oldProps).forEach(k=>{
            if(k!=='children'&&!newProps[k]){
                if(k.startsWith('on'))
                    dom.removeEventListener(k.substring(2).toLowerCase(),oldProps[k])
                else dom[k]=''
            }        
        })
        fiber.old=null //diff完之后释放旧fiber
    }
    private workLoop = (deadline:IdleDeadline):void=>{
        let shouldYield=false
        while(this.nextUnitWork&&!shouldYield){
            this.nextUnitWork=this.performUnitWork(this.nextUnitWork)
            if(deadline.timeRemaining()<this.unitWorkTime) shouldYield=true
        }
        //所有fiber处理完后 将所有fiber的dom组织在一起便于一次性呈现完整的UI
        if(!this.nextUnitWork&&this.currentRootFiber){
            this.commitWork(this.currentRootFiber.child)
            this.currentRootFiber.old=null
            this.currentRootFiber=null    //这一轮工作提交完成 
        }
            
        window.requestIdleCallback(this.workLoop)
    }
    constructor(rootFiber:fiber){
        this.nextUnitWork=rootFiber
        this.currentRootFiber=rootFiber
    }
    public start(){
        window.requestIdleCallback(this.workLoop)
    }

}

function createTextElement(text:string):ReactElement{
    return {
        type:'TextElement',
        props:{
            nodeValue:text,
            children:[]
        }
    }
}

function createElement(type:keyof HTMLElementTagNameMap|FunctionComponentConstructor,
    props:Object,...children:(string|ReactElement)[]):ReactElement{
    return {
        type,
        props:{
            ...props,
            children:children.map(child=>(typeof child==='object'?child:createTextElement(child)))
        }
    }
}

function render(element:ReactElement,container:HTMLElement):void {
    const rootFiber:fiber={
        type: container.tagName,
        dom: container,
        parent: null,
        old: null,
        props: {
            children: [element]
        },
        child: null,
        sibling: null,
        effectTag:Effect.PLACEMENT
    }
    const fiberScheduler:FiberScheduler=new FiberScheduler(rootFiber)
    initialHookFiberScheduler(fiberScheduler)
    fiberScheduler.start()
}

function memo(functionComponent:FunctionComponentConstructor,
            isSameProps?:(oldProps:object,newProps:object)=>boolean):FunctionComponentConstructor {
            if(!isSameProps)
                isSameProps=(oldProps:object,newProps:object)=>{
                    let flag=false
                    if(!oldProps&&!newProps) flag=true
                    else if(!oldProps||!newProps) flag=false
                    else if(Object.keys(oldProps).length!==Object.keys(newProps).length) flag=false
                    else {
                        flag=true
                        for(const k in newProps)  
                            if(k!=='children'&&!oldProps[k]||oldProps[k]!==newProps[k]){
                                flag=false
                                break
                            }
                    }
                    return flag
                }
            functionComponent.isSameProps=isSameProps
            functionComponent.isMemorized=true
            return functionComponent
}
export default {
    createElement,render,memo
}


