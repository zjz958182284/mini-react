
let hookCurrentFiber:fiber=null
let hookIndex:number=null
let fiberScheduler:FiberScheduler=null

export function initialHookVars(hcFiber:fiber,hIdx:number):void{
    hookCurrentFiber=hcFiber
    hookIndex=hIdx
}
export function initialHookFiberScheduler(fs):void{
    fiberScheduler=fs
}

//尚未解决的问题，如何确定functionFiber的复用顺序
//eg:两个A函数组件 状态更新后只剩一个A，那么这个A是复用之前第一个A还是第二个A的hooks 等等这一类问题(如果可以编译时为函数组件添加k就好了)
export function useState<T>(initial:T):[T,setState<T>]{
    let hook=null
    if(!hookCurrentFiber.hooks[hookIndex]){
        hook={
            state:initial,
            actions:[]
        }
    }else{
        hook=hookCurrentFiber.hooks[hookIndex]
        hook.actions.forEach(action => {
            hook.state=action(hook.state)
        });
        hook.actions=[]
    }
    hookCurrentFiber.hooks[hookIndex]=hook
    hookIndex++
    //异步更新state 每个setState保存一份当前hookFiber的引用
    const _hookCurrentFiber=hookCurrentFiber
    function setState(action:action<T>){
        if(typeof action!=='function')
            hook.actions.push((state)=>action)
        else hook.actions.push(action)
        const curRootFiber=fiberScheduler.getCurrentRootFiber()
        let p=_hookCurrentFiber
        while(p&&p!=curRootFiber) p=p.parent
        if(!p) {
            _hookCurrentFiber.old=_hookCurrentFiber
            fiberScheduler.setUpdateWork(_hookCurrentFiber)
        }
    }
    return [hook.state,setState]
}

//ToDo
function useEffect(){

}