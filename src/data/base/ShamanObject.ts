
import * as M from "maybe/Maybe"
import * as XML from "./XML"
import * as util from "./util"
import * as Common from "./Common"

const attributes = [
  "X", "Y", 
  "C", "nosync", "Mp", "Mv", "P",
  "stop", "size",
] as const
const undefinedAttributes = Common.makeUndefinedAttributes(attributes)

export type Type = number
export enum Anchor {
  Red = 11,
  Green = 14,
  Yellow = 22,
  GreenClockwise = 15,
  GreenCounterClockwise = 16,
  RedClockwise = 12,
  RedCounterClockwise = 13,
}
const anchorTypes = [Anchor.Red, Anchor.Green, Anchor.Yellow, Anchor.GreenClockwise, Anchor.GreenCounterClockwise, Anchor.RedClockwise, Anchor.RedCounterClockwise]

export interface Node extends XML.Node {
  name: "O",
  children: [],
  attributes: Partial<Record<typeof attributes[number], string>>
}

interface Base extends Common.UnknownAttributes {
  x: number
  y: number
  nosync: boolean
}

export type ShamanObject

  = { type: Type
      rotation: number
      ghost: boolean }
    & Base

  | { type: Anchor.Yellow
      stop: boolean
      size: number }
    & Base

  | { type: Exclude<Anchor, Anchor.Yellow>
      power: number
      speed: number }
    & Base

export interface ShamanObjectProps extends Base {
  type: Type
  rotation: number
  ghost: boolean
  power: number
  speed: number
  stop: boolean
  size: number
}

export const isAnchor = (data: ShamanObject): data is Extract<ShamanObject, {type: Anchor}> =>
  anchorTypes.includes(data.type)
  

const baseDefaults: () => Base = () => ({
  unknownAttributes: {},
  x: 0,
  y: 0,
  nosync: false,
})

export const defaults: (t: Type) => ShamanObject = type =>
 ({ ...baseDefaults(),
    ...(
      type === Anchor.Yellow ?
        { type: Anchor.Yellow,
          stop: false,
          size: 1 }
      :
      anchorTypes.includes(type) ?
        { type: type as Exclude<Anchor, Anchor.Yellow>,
          power: 0,
          speed: 0 }
      :
      { type,
        rotation: 0,
        ghost: false, }
    ) 
  })

export function decode(xmlNode: XML.Node): ShamanObject {
  let node = xmlNode as Node
  const getAttr = util.makeGetter(node.attributes)
  
  let type: Type = M.withDefault (0) (getAttr ("C") (readType))
  
  let data = defaults(type)
  data.unknownAttributes = Common.getUnknownAttributes(attributes, node.attributes)
  const setProp = util.makeSetter(data as ShamanObjectProps)

  setProp ("x") (getAttr ("X") (util.readInt))
  setProp ("y") (getAttr ("Y") (util.readInt))

  setProp ("nosync")  (getAttr ("nosync") (() => true))

  setProp ("power") (getAttr ("Mp") (util.readFloat))
  setProp ("speed") (getAttr ("Mv") (util.readFloat))

  getAttr ("P") (readRotationGhost, r => {
    setProp ("rotation") (r.rotation)
    setProp ("ghost")    (r.ghost)
  })

  setProp ("stop") (getAttr ("stop") (() => true))
  setProp ("size") (getAttr ("size") (util.readFloat))

  return data
}

export function encode(data: ShamanObject): Node {
  let node: Node = {
    name: "O",
    children: [],
    attributes: {
      ...undefinedAttributes,
      ...data.unknownAttributes,
    }
  }

  const getProp = util.makeGetter<ShamanObjectProps>(data)
  const setAttr = util.makeSetter(node.attributes)

  setAttr ("C") (getProp ("type") (util.writeInt))

  setAttr ("X") (getProp ("x") (util.writeInt))
  setAttr ("Y") (getProp ("y") (util.writeInt))
  setAttr ("nosync") (getProp ("nosync")  (util.omitOn(false), () => ""))
  
  setAttr ("Mp") (getProp ("power") (util.writeFloat, util.omitOn("0")))
  setAttr ("Mv") (getProp ("speed") (util.writeFloat, util.omitOn("0")))

  setAttr ("P") (M.withDefault ("0") 
    (M.map(
      (f,r) => util.omitOn ("0,0") (writeRotationGhost(f,r)),
      getProp ("rotation") (),
      getProp ("ghost") (),
  )))
  
  setAttr ("stop") (getProp ("stop") (util.omitOn(false), () => ""))
  setAttr ("size") (getProp ("size") (util.writeFloat, util.omitOn("1")))

  return node
}


export function readType(str: string): M.Maybe<number> {
  return M.andThen(
    util.readInt(str),
    M.iff(x => x >= 0)
  )
}

// Format: "r,g"
function readRotationGhost(str: string) {
  let parts = str.split(",")
  return {
    rotation: M.andThen(parts.shift(), M.iffDefined, util.readFloat),
    ghost:    M.andThen(parts.shift(), M.iffDefined, util.readBool),
  }
}
function writeRotationGhost(rotation: number, ghost: boolean): string {
  return [
    util.writeFloat(rotation),
    util.writeBool(ghost),
  ].join(",")
}