
import React from './React/React'
import { useState } from './React/Hook'

const Didact=React
/** @jsx Didact.createElement */
function Some(props) {
  
  const [state,setState]=useState(props.num)
  return (
    <div>
      <b style="color:green" onClick={(e)=>{setState((state)=>state+1);console.log(props.key+'-'+state)}}>click me</b>
      <div>{state}</div>
      <Some2  num={4}/>
    </div>
  )
}
function Some2(props) {
  
  const [state,setState]=useState(props.num)
  return (
    <div>
      <b style="color:pink" onClick={(e)=>{
        setState((state)=>state+1);
        console.log(props.key+'-'+state)}}>click me</b>
      <div>{state}</div>
    </div>
  )
}
function App(props) {
  const [state,setState]=useState(0)
  return (
    <div id="foo">
      <b style="color:red" onClick={(e)=>{
        setState((state)=>state+1);
        console.log('APP')}}>click me</b>
      <div>{state}</div>
      <Some key='key1' num={1} >
      </Some>
      <Some2 key='key2' num={2} />
    </div>
  )
}
/** @jsx Didact.createElement */
const element = <App name='foo'/>
Didact.render(element,document.getElementById('root'))
