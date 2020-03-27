
import { writable, Writable, derived, get as storeGet } from "svelte/store"

import * as Editor from "data/editor"
import * as sceneObjects from "state/sceneObjects"
import { SceneObject } from "state/sceneObjects"
import { store } from "state/util"

const blank = store({})
let selectionMap = new Map<SceneObject, ()=>void>()

export function size(): number {
  return selectionMap.size
}

export function clear() {
  for(let [obj,unsubscribe] of selectionMap.entries()) {
    obj.selected = false
    obj.invalidate()
    unsubscribe()
  }
  selectionMap.clear()
  blank.invalidate()
}
export function set(objs: SceneObject[]) {
  clear()
  selectionMap = new Map()
  for(let obj of objs) {
    obj.selected = true
    obj.invalidate()
    let unsubscribe = obj.subscribe(blank.invalidate)
    selectionMap.set(obj, unsubscribe)
  }
  blank.invalidate()
}
export function select(obj: SceneObject) {
  if(selectionMap.has(obj)) return
  obj.selected = true
  obj.invalidate()
  selectionMap.set(obj, obj.subscribe(blank.invalidate))
  blank.invalidate()
}
export function unselect(obj: SceneObject) {
  let unsubscribe = selectionMap.get(obj)
  if(!unsubscribe) return
  unsubscribe()
  obj.selected = false
  obj.invalidate()
  selectionMap.delete(obj)
  blank.invalidate()
}
export function has(obj: SceneObject): boolean {
  return selectionMap.has(obj)
}
export function getAll(): SceneObject[] {
  return [...selectionMap.keys()]
}

export function remove() {
  for(let unsubscribe of selectionMap.values())
    unsubscribe()

  let all = [...selectionMap.keys()].sort((a,b) => b.index-a.index)
  let platforms = all.filter(Editor.isPlatform)
  let joints = sceneObjects.groups.joints
    .filter(obj => !obj.selected)
    .filter(obj => (platforms.includes(obj.platform1 as any) && (obj.platform1 as any).index > 0)
                || (platforms.includes(obj.platform2 as any) && (obj.platform2 as any).index > 0))

  for(let obj of all.concat(joints))
    sceneObjects.remove(obj)
  selectionMap.clear()
  blank.invalidate()
}

export function duplicate() {
  let duplicates = []
  for(let obj of selectionMap.keys()) {
    let data = Editor.clone(obj)
    duplicates.push(
      sceneObjects.add(data, data.index+1)
    )
  }
  clear()
  for(let obj of duplicates)
    select(obj)
  move(40, 0)
}

export function move(dx: number, dy: number) {
  for(let obj of selectionMap.keys()) {
    Editor.move(obj, dx, dy)
    obj.invalidate()
  }
}

export function resize(dx: number, dy: number) {
  for(let obj of selectionMap.keys()) {
    if(!Editor.isPlatform(obj)) continue
    Editor.Platform.resize(obj, dx, dy)
    obj.invalidate()
  }
}

export function shiftIndex(dz: number) {

}

export function flip() {
  if(selectionMap.size <= 0) return

  let x1 = Math.min( ...[...selectionMap.keys()].map(Editor.getBoundingBox).map(bb => bb.p1.x) )
  let x2 = Math.max( ...[...selectionMap.keys()].map(Editor.getBoundingBox).map(bb => bb.p2.x) )

  let cx = x1 + (x2-x1)/2

  for(let obj of selectionMap.keys()) {
    Editor.flip(obj, cx)
    obj.invalidate()
  }
}

export function rotate(a: number) {
  for(let obj of selectionMap.keys()) {
    Editor.rotate(obj, a)
    obj.invalidate()
  }
}

export function rotateAround(a: number, p: Point) {
  for(let obj of selectionMap.keys()) {
    Editor.rotateAround(obj, a, p)
    obj.invalidate()
  }
}


export const selection = derived(blank, getAll)

