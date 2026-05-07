// ============================================================
// 类型定义 & 导入
// ============================================================

import {
  BoxGeometry,
  BufferGeometry,
  Controls,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  LineBasicMaterial,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Quaternion,
  Raycaster,
  SphereGeometry,
  TorusGeometry,
  Vector3, Camera, type BaseEvent,
  Vector2, Color
} from 'three'

/** 所有支持的变换模式。'all' 模式同时展示平移/旋转/缩放三种 gizmo */
export type TransformControlsMode = "translate" | "rotate" | "scale" | "all"

export interface TransformControlsEventMap {
  change: {}
  mouseDown: { mode: TransformControlsMode }
  mouseUp: { mode: TransformControlsMode }
  objectChange: {}
  "camera-changed": { value: unknown }
  "object-changed": { value: unknown }
  "enabled-changed": { value: unknown }
  "axis-changed": { value: unknown }
  "mode-changed": { value: unknown }
  "translationSnap-changed": { value: unknown }
  "rotationSnap-changed": { value: unknown }
  "scaleSnap-changed": { value: unknown }
  "scaleSensitivity-changed": { value: unknown }
  "space-changed": { value: unknown }
  "size-changed": { value: unknown }
  "dragging-changed": { value: unknown }
  "showX-changed": { value: unknown }
  "showY-changed": { value: unknown }
  "showZ-changed": { value: unknown }
  "minX-changed": { value: unknown }
  "maxX-changed": { value: unknown }
  "minY-changed": { value: unknown }
  "maxY-changed": { value: unknown }
  "minZ-changed": { value: unknown }
  "maxZ-changed": { value: unknown }
  "worldPosition-changed": { value: unknown }
  "worldPositionStart-changed": { value: unknown }
  "worldQuaternion-changed": { value: unknown }
  "worldQuaternionStart-changed": { value: unknown }
  "cameraPosition-changed": { value: unknown }
  "cameraQuaternion-changed": { value: unknown }
  "pointStart-changed": { value: unknown }
  "pointEnd-changed": { value: unknown }
  "rotationAxis-changed": { value: unknown }
  "rotationAngle-changed": { value: unknown }
  "eye-changed": { value: unknown }
}

type axisType = "X" | "Y" | "Z" | "E" | "XY" | "YZ" | "XZ" | "XYZ" | "XYZE" | null

interface IPointerType { x: number; y: number; button: number }

type axisColorType = number | Color | string

// ============================================================
// 共享工具变量 —— 全局复用 Vector3/Quaternion/Raycaster
// ============================================================

const _raycaster = new Raycaster()
const _tempVector = new Vector3()
const _tempVector2 = new Vector3()
const _tempQuaternion = new Quaternion()

/** 三个世界单位轴 */
const _unit = {
  X: new Vector3(1, 0, 0),
  Y: new Vector3(0, 1, 0),
  Z: new Vector3(0, 0, 1),
}

// ============================================================
// 事件对象 —— 预创建的不可变事件体
// ============================================================

const _changeEvent = { type: 'change' }

const _mouseDownEvent: { type: 'mouseDown'; mode: keyof TransformControlsMode | string | null } = { type: 'mouseDown', mode: null }

const _mouseUpEvent: { type: 'mouseUp'; mode: keyof TransformControlsMode | string | null } = { type: 'mouseUp', mode: null }

const _objectChangeEvent = { type: 'objectChange' }

// ============================================================
// TTControls 主类
// ============================================================

class TTControls extends Controls<TransformControlsEventMap> {

  [key: string]: any

  // ── 公开属性 ──
  camera!: Camera
  axis!: axisType | string
  mode!: TransformControlsMode
  translationSnap!: number | null
  rotationSnap!: number | null
  scaleSnap!: number | null
  scaleSensitivity!: number
  space!: "world" | "local"
  size!: number
  dragging!: boolean
  showX!: boolean
  showY!: boolean
  showZ!: boolean
  minX!: number; maxX!: number
  minY!: number; maxY!: number
  minZ!: number; maxZ!: number
  worldPosition!: Vector3
  rotationAngle!: number
  rotationAxis!: Vector3

  // ── 私有子组件 ──
  private _root: TransformControlsRoot
  private _gizmo: TransformControlsGizmo
  private _plane: TransformControlsPlane

  /**
   * All 模式下，记录当前拖拽的实际子模式（translate / rotate / scale）。
   * 由 pointerHover 阶段解析 picker 元素名称时赋值。
   * 非 All 模式下为 null。
   */
  private _allSubMode: TransformControlsMode | null = null

  constructor(camera: Camera, domElement: HTMLElement | SVGElement | null = null) {
    super(camera, domElement)

    /* ---- 构建三组件树：root → gizmo + plane ---- */
    const root = new TransformControlsRoot(this)
    this._root = root
    const gizmo = new TransformControlsGizmo()
    this._gizmo = gizmo
    root.add(gizmo)
    const plane = new TransformControlsPlane()
    this._plane = plane
    root.add(plane)

    const scope = this

    /**
     * 统一属性定义器：对 scope 创建 getter/setter，
     * 同时将属性值下发给 gizmo 和 plane，并派发 change 事件。
     */
    function defineProperty(propName: string, defaultValue: any) {
      let propValue = defaultValue
      Object.defineProperty(scope, propName, {
        get() { return propValue !== undefined ? propValue : defaultValue },
        set(value) {
          if (propValue !== value) {
            propValue = value
            plane[propName] = value
            gizmo[propName] = value
            scope.dispatchEvent({ type: propName + '-changed' as keyof TransformControlsEventMap, value } as BaseEvent<keyof TransformControlsEventMap>)
            scope.dispatchEvent(_changeEvent as BaseEvent<keyof TransformControlsEventMap>)
          }
        },
      })
      scope[propName] = defaultValue
      plane[propName] = defaultValue
      gizmo[propName] = defaultValue
    }

    // ── 注册所有属性 ──
    defineProperty('camera', camera)
    defineProperty('object', undefined)
    defineProperty('enabled', true)
    defineProperty('axis', null)
    defineProperty('mode', 'translate')
    defineProperty('translationSnap', null)
    defineProperty('rotationSnap', null)
    defineProperty('scaleSnap', null)
    defineProperty('scaleSensitivity', 0.2)
    defineProperty('space', 'world')
    defineProperty('size', 1)
    defineProperty('dragging', false)
    defineProperty('showX', true)
    defineProperty('showY', true)
    defineProperty('showZ', true)
    defineProperty('minX', -Infinity)
    defineProperty('maxX', Infinity)
    defineProperty('minY', -Infinity)
    defineProperty('maxY', Infinity)
    defineProperty('minZ', -Infinity)
    defineProperty('maxZ', Infinity)

    // ── 内部运行时状态变量 ──
    const worldPosition = new Vector3()
    const worldPositionStart = new Vector3()
    const worldQuaternion = new Quaternion()
    const worldQuaternionStart = new Quaternion()
    const cameraPosition = new Vector3()
    const cameraQuaternion = new Quaternion()
    const pointStart = new Vector3()
    const pointEnd = new Vector3()
    const rotationAxis = new Vector3()
    const rotationAngle = 0
    const eye = new Vector3()

    defineProperty('worldPosition', worldPosition)
    defineProperty('worldPositionStart', worldPositionStart)
    defineProperty('worldQuaternion', worldQuaternion)
    defineProperty('worldQuaternionStart', worldQuaternionStart)
    defineProperty('cameraPosition', cameraPosition)
    defineProperty('cameraQuaternion', cameraQuaternion)
    defineProperty('pointStart', pointStart)
    defineProperty('pointEnd', pointEnd)
    defineProperty('rotationAxis', rotationAxis)
    defineProperty('rotationAngle', rotationAngle)
    defineProperty('eye', eye)

    // ── 局部缓冲变量（用于位移/旋转/缩放计算）──
    this._offset = new Vector3()
    this._startNorm = new Vector3()
    this._endNorm = new Vector3()
    this._cameraScale = new Vector3()
    this._parentPosition = new Vector3()
    this._parentQuaternion = new Quaternion()
    this._parentQuaternionInv = new Quaternion()
    this._parentScale = new Vector3()
    this._worldScaleStart = new Vector3()
    this._worldQuaternionInv = new Quaternion()
    this._worldScale = new Vector3()
    this._positionStart = new Vector3()
    this._quaternionStart = new Quaternion()
    this._scaleStart = new Vector3()

    // 绑定指针事件处理器
    this._getPointer = getPointer.bind(this)
    this._onPointerDown = onPointerDown.bind(this)
    this._onPointerHover = onPointerHover.bind(this)
    this._onPointerMove = onPointerMove.bind(this)
    this._onPointerUp = onPointerUp.bind(this)

    if (domElement !== null) {
      this.connect(domElement)
    }
  }

  // ── DOM 连接/断开 ──

  connect(element: HTMLElement | SVGElement) {
    super.connect(element)
    if (!this.domElement) { console.warn('TTControls: domElement 为空'); return }
    this.domElement.addEventListener('pointerdown', this._onPointerDown)
    this.domElement.addEventListener('pointermove', this._onPointerHover)
    this.domElement.addEventListener('pointerup', this._onPointerUp)
    this.domElement.style.touchAction = 'none'
  }

  disconnect() {
    if (!this.domElement) { console.warn('TTControls: domElement 为空'); return }
    this.domElement.removeEventListener('pointerdown', this._onPointerDown)
    this.domElement.removeEventListener('pointermove', this._onPointerHover)
    this.domElement.removeEventListener('pointermove', this._onPointerMove)
    this.domElement.removeEventListener('pointerup', this._onPointerUp)
    this.domElement.style.touchAction = 'auto'
  }

  getHelper(): TransformControlsRoot { return this._root }

  // ============================================================
  // 交互逻辑 —— hover / down / move / up
  // ============================================================

  /**
   * 悬停检测：射线命中哪个 picker 元素，就赋予其 name 为当前轴。
   * All 模式特殊处理：name 形如 "t_X"，需解析出子模式和纯轴名。
   */
  pointerHover(pointer: Vector2) {
    if (this.object === undefined || this.dragging === true) return
    if (pointer !== null) _raycaster.setFromCamera(pointer, this.camera)

    // All 模式下使用组合 picker
    const pickerKey = this.mode === 'all' ? 'all' : this.mode
    const pickerObj = this._gizmo.picker[pickerKey]
    const intersect = intersectObjectWithRay(pickerObj, _raycaster)

    if (intersect) {
      const rawName: string = intersect.object.name

      if (this.mode === 'all') {
        // rawName 格式: "t_X" / "r_Y" / "s_Z" / "t_XY" 等
        // 首字符: t=平移, r=旋转, s=缩放
        const prefix = rawName.charAt(0)
        const axisPart = rawName.substring(2) // 去掉 "t_" 前缀
        if (prefix === 't') {
          this._allSubMode = 'translate'
          this.axis = axisPart
        } else if (prefix === 'r') {
          this._allSubMode = 'rotate'
          this.axis = axisPart
        } else if (prefix === 's') {
          this._allSubMode = 'scale'
          this.axis = axisPart
        } else {
          this._allSubMode = 'translate'
          this.axis = rawName
        }
      } else {
        this._allSubMode = null
        this.axis = rawName
      }

      // console.log(this.axis, this.mode, this._allSubMode, this._gizmo.gizmo[this.mode])
      this.showX = this.axis.search('X') !== -1
      this.showY = this.axis.search('Y') !== -1
      this.showZ = this.axis.search('Z') !== -1
    } else {
      this.showX = this.showY = this.showZ = true
      this.axis = null
      this._allSubMode = null
    }
  }

  pointerDown(pointer: IPointerType) {
    if (this.object === undefined || this.dragging === true || (pointer != null && pointer.button !== 0)) return
    if (this.axis !== null) {
      if (pointer !== null) _raycaster.setFromCamera(new Vector2(pointer.x, pointer.y), this.camera)
      const planeIntersect = intersectObjectWithRay(this._plane, _raycaster, true)
      if (planeIntersect) {
        this.object.updateMatrixWorld()
        this.object.parent?.updateMatrixWorld()
        this._positionStart.copy(this.object.position)
        this._quaternionStart.copy(this.object.quaternion)
        this._scaleStart.copy(this.object.scale)
        this.object.matrixWorld.decompose(this.worldPositionStart, this.worldQuaternionStart, this._worldScaleStart)
        this.pointStart.copy(planeIntersect.point).sub(this.worldPositionStart)
      }
      this.dragging = true
      _mouseDownEvent.mode = this.mode
      this.dispatchEvent(_mouseDownEvent as BaseEvent<keyof TransformControlsEventMap>)
    }
  }

  /**
   * 根据当前 axis 及 mode 确定 space 和 effectiveMode，然后分发到具体变换逻辑。
   */
  pointerMove(pointer: IPointerType) {
    const axis = this.axis
    const object = this.object
    let effectiveMode: TransformControlsMode = this.mode
    let space = this.space

    // All 模式下：从 _allSubMode 确定实际执行的变换类别
    if (this.mode === 'all' && this._allSubMode) {
      effectiveMode = this._allSubMode
    }

    if (effectiveMode === 'scale') {
      space = 'local'
    } else if (axis === 'E' || axis === 'XYZE' || axis === 'XYZ') {
      space = 'world'
    }

    if (object === undefined || axis === null || this.dragging === false || (pointer !== null && pointer.button !== -1)) return
    if (pointer !== null) _raycaster.setFromCamera(new Vector2(pointer.x, pointer.y), this.camera)

    const planeIntersect = intersectObjectWithRay(this._plane, _raycaster, true)
    if (!planeIntersect) return

    this.pointEnd.copy(planeIntersect.point).sub(this.worldPositionStart)

    // ============================================================
    // 平移逻辑
    // ============================================================
    if (effectiveMode === 'translate') {
      this._offset.copy(this.pointEnd).sub(this.pointStart)

      if (space === 'local' && axis !== 'XYZ') {
        this._offset.applyQuaternion(this._worldQuaternionInv)
      }

      if (axis.indexOf('X') === -1) this._offset.x = 0
      if (axis.indexOf('Y') === -1) this._offset.y = 0
      if (axis.indexOf('Z') === -1) this._offset.z = 0

      if (space === 'local' && axis !== 'XYZ') {
        this._offset.applyQuaternion(this._quaternionStart).divide(this._parentScale)
      } else {
        this._offset.applyQuaternion(this._parentQuaternionInv).divide(this._parentScale)
      }

      object.position.copy(this._offset).add(this._positionStart)

      // 平移吸附
      if (this.translationSnap) {
        if (space === 'local') {
          object.position.applyQuaternion(_tempQuaternion.copy(this._quaternionStart).invert())
          if (axis.search('X') !== -1) object.position.x = Math.round(object.position.x / this.translationSnap) * this.translationSnap
          if (axis.search('Y') !== -1) object.position.y = Math.round(object.position.y / this.translationSnap) * this.translationSnap
          if (axis.search('Z') !== -1) object.position.z = Math.round(object.position.z / this.translationSnap) * this.translationSnap
          object.position.applyQuaternion(this._quaternionStart)
        }
        if (space === 'world') {
          if (object.parent) object.position.add(_tempVector.setFromMatrixPosition(object.parent.matrixWorld))
          if (axis.search('X') !== -1) object.position.x = Math.round(object.position.x / this.translationSnap) * this.translationSnap
          if (axis.search('Y') !== -1) object.position.y = Math.round(object.position.y / this.translationSnap) * this.translationSnap
          if (axis.search('Z') !== -1) object.position.z = Math.round(object.position.z / this.translationSnap) * this.translationSnap
          if (object.parent) object.position.sub(_tempVector.setFromMatrixPosition(object.parent.matrixWorld))
        }
      }

      object.position.x = Math.max(this.minX, Math.min(this.maxX, object.position.x))
      object.position.y = Math.max(this.minY, Math.min(this.maxY, object.position.y))
      object.position.z = Math.max(this.minZ, Math.min(this.maxZ, object.position.z))
    }
    // ============================================================
    // 缩放逻辑
    // ============================================================
    else if (effectiveMode === 'scale') {
      if (axis.search('XYZ') !== -1) {
        let d = this.pointEnd.length() / this.pointStart.length()
        if (this.pointEnd.dot(this.pointStart) < 0) d *= -1
        _tempVector2.set(d, d, d)
      } else {
        _tempVector.copy(this.pointStart)
        _tempVector2.copy(this.pointEnd)
        _tempVector.applyQuaternion(this._worldQuaternionInv)
        _tempVector2.applyQuaternion(this._worldQuaternionInv)
        _tempVector2.divide(_tempVector)
        if (axis.search('X') === -1) _tempVector2.x = 1
        if (axis.search('Y') === -1) _tempVector2.y = 1
        if (axis.search('Z') === -1) _tempVector2.z = 1
      }

      if (this.scaleSensitivity !== 1) {
        _tempVector2.x = 1 + (_tempVector2.x - 1) * this.scaleSensitivity
        _tempVector2.y = 1 + (_tempVector2.y - 1) * this.scaleSensitivity
        _tempVector2.z = 1 + (_tempVector2.z - 1) * this.scaleSensitivity
      }

      object.scale.copy(this._scaleStart).multiply(_tempVector2)

      if (this.scaleSnap) {
        if (axis.search('X') !== -1) object.scale.x = Math.round(object.scale.x / this.scaleSnap) * this.scaleSnap || this.scaleSnap
        if (axis.search('Y') !== -1) object.scale.y = Math.round(object.scale.y / this.scaleSnap) * this.scaleSnap || this.scaleSnap
        if (axis.search('Z') !== -1) object.scale.z = Math.round(object.scale.z / this.scaleSnap) * this.scaleSnap || this.scaleSnap
      }
    }
    // ============================================================
    // 旋转逻辑
    // ============================================================
    else if (effectiveMode === 'rotate') {
      this._offset.copy(this.pointEnd).sub(this.pointStart)
      const ROTATION_SPEED = 20 / this.worldPosition.distanceTo(_tempVector.setFromMatrixPosition(this.camera.matrixWorld))
      let _inPlaneRotation = false

      if (axis === 'XYZE') {
        this.rotationAxis.copy(this._offset).cross(this.eye).normalize()
        this.rotationAngle = this._offset.dot(_tempVector.copy(this.rotationAxis).cross(this.eye)) * ROTATION_SPEED
      } else if (axis === 'X' || axis === 'Y' || axis === 'Z') {
        this.rotationAxis.copy(_unit[axis])
        _tempVector.copy(_unit[axis])
        if (space === 'local') _tempVector.applyQuaternion(this.worldQuaternion)
        _tempVector.cross(this.eye)
        if (_tempVector.length() === 0) {
          _inPlaneRotation = true
        } else {
          this.rotationAngle = this._offset.dot(_tempVector.normalize()) * ROTATION_SPEED
        }
      }

      if (axis === 'E' || _inPlaneRotation) {
        this.rotationAxis.copy(this.eye)
        this.rotationAngle = this.pointEnd.angleTo(this.pointStart)
        this._startNorm.copy(this.pointStart).normalize()
        this._endNorm.copy(this.pointEnd).normalize()
        this.rotationAngle *= (this._endNorm.cross(this._startNorm).dot(this.eye) < 0 ? 1 : -1)
      }

      if (this.rotationSnap) this.rotationAngle = Math.round(this.rotationAngle / this.rotationSnap) * this.rotationSnap

      if (space === 'local' && axis !== 'E' && axis !== 'XYZE') {
        object.quaternion.copy(this._quaternionStart)
        object.quaternion.multiply(_tempQuaternion.setFromAxisAngle(this.rotationAxis, this.rotationAngle)).normalize()
      } else {
        this.rotationAxis.applyQuaternion(this._parentQuaternionInv)
        object.quaternion.copy(_tempQuaternion.setFromAxisAngle(this.rotationAxis, this.rotationAngle))
        object.quaternion.multiply(this._quaternionStart).normalize()
      }
    }

    this.dispatchEvent(_changeEvent as BaseEvent<keyof TransformControlsEventMap>)
    this.dispatchEvent(_objectChangeEvent as BaseEvent<keyof TransformControlsEventMap>)
  }

  pointerUp(pointer: IPointerType) {
    if (pointer !== null && pointer.button !== 0) return
    if (this.dragging && this.axis !== null) {
      _mouseUpEvent.mode = this.mode
      this.dispatchEvent(_mouseUpEvent as BaseEvent<keyof TransformControlsEventMap>)
    }
    this.dragging = false
    this.axis = null
    this._allSubMode = null
  }

  // ── 生命周期 ──

  dispose() { this.disconnect(); this._root.dispose() }

  attach(object: Object3D) { this.object = object; this._root.visible = true; return this }

  detach() { this.object = undefined!; this.axis = null; this._root.visible = false; return this }

  reset() {
    if (!this.enabled || !this.dragging) return
    this.object.position.copy(this._positionStart)
    this.object.quaternion.copy(this._quaternionStart)
    this.object.scale.copy(this._scaleStart)
    this.dispatchEvent(_changeEvent as BaseEvent<keyof TransformControlsEventMap>)
    this.dispatchEvent(_objectChangeEvent as BaseEvent<keyof TransformControlsEventMap>)
    this.pointStart.copy(this.pointEnd)
  }

  getRaycaster() { return _raycaster }
  getMode() { return this.mode }
  /** All 模式下的实际子模式（translate/rotate/scale），仅 All 模式拖拽时有值 */
  getAllSubMode(): TransformControlsMode | null { return this._allSubMode }
  setMode(mode: TransformControlsMode) { this.mode = mode }
  setTranslationSnap(v: number) { this.translationSnap = v }
  setRotationSnap(v: number) { this.rotationSnap = v }
  setScaleSnap(v: number) { this.scaleSnap = v }
  setScaleSensitivity(v: number) { this.scaleSensitivity = v }
  setSize(v: number) { this.size = v }
  setSpace(space: 'world' | 'local') { this.space = space }

  setColors(xAxis: axisColorType, yAxis: axisColorType, zAxis: axisColorType, active: axisColorType) {
    const lib = this._gizmo.materialLib
    lib.xAxis.color.set(xAxis)
    lib.yAxis.color.set(yAxis)
    lib.zAxis.color.set(zAxis)
    lib.active.color.set(active)
    lib.xAxisTransparent.color.set(xAxis)
    lib.yAxisTransparent.color.set(yAxis)
    lib.zAxisTransparent.color.set(zAxis)
    lib.activeTransparent.color.set(active)
    if (lib.xAxis._color) lib.xAxis._color.set(xAxis)
    if (lib.yAxis._color) lib.yAxis._color.set(yAxis)
    if (lib.zAxis._color) lib.zAxis._color.set(zAxis)
    if (lib.active._color) lib.active._color.set(active)
    if (lib.xAxisTransparent._color) lib.xAxisTransparent._color.set(xAxis)
    if (lib.yAxisTransparent._color) lib.yAxisTransparent._color.set(yAxis)
    if (lib.zAxisTransparent._color) lib.zAxisTransparent._color.set(zAxis)
    if (lib.activeTransparent._color) lib.activeTransparent._color.set(active)
  }
}

// ============================================================
// 指针事件处理器（独立函数，bind 到 TTControls 实例）
// ============================================================

function getPointer(this: TTControls, event: MouseEvent): IPointerType | undefined {
  if (!this?.domElement) { console.warn('domElement 未定义'); return }
  if (this.domElement.ownerDocument.pointerLockElement) {
    return { x: 0, y: 0, button: event.button }
  }
  const rect = this.domElement.getBoundingClientRect()
  return {
    x: (event.clientX - rect.left) / rect.width * 2 - 1,
    y: -(event.clientY - rect.top) / rect.height * 2 + 1,
    button: event.button,
  }
}

function onPointerHover(this: TTControls, event: PointerEvent) {
  if (!this.enabled) return
  if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
    this.pointerHover(this._getPointer(event) as Vector2)
  }
}

function onPointerDown(this: TTControls, event: PointerEvent) {
  if (!this.enabled) return
  if (!this.domElement) { console.warn('domElement 未定义'); return }
  if (!document.pointerLockElement) this.domElement.setPointerCapture(event.pointerId)
  this.domElement.addEventListener('pointermove', this._onPointerMove)
  this.pointerHover(this._getPointer(event) as Vector2)
  this.pointerDown(this._getPointer(event) as IPointerType)
}

function onPointerMove(this: TTControls, event: PointerEvent) {
  if (!this.enabled) return
  this.pointerMove(this._getPointer(event) as IPointerType)
}

function onPointerUp(this: TTControls, event: PointerEvent) {
  if (!this.enabled) return
  if (!this.domElement) { console.warn('domElement 未定义'); return }
  this.domElement.releasePointerCapture(event.pointerId)
  this.domElement.removeEventListener('pointermove', this._onPointerMove)
  this.pointerUp(this._getPointer(event) as IPointerType)
}

/** 射线与物体的相交检测，可选是否包含不可见对象 */
function intersectObjectWithRay(object: Object3D, raycaster: Raycaster, includeInvisible?: boolean) {
  const all = raycaster.intersectObject(object, true)
  for (let i = 0; i < all.length; i++) {
    if (all[i].object.visible || includeInvisible) return all[i]
  }
  return false
}

// ============================================================
// TransformControlsRoot —— 场景根节点
// ============================================================

const _tempQuaternion2 = new Quaternion()
const _identityQuaternion = new Quaternion()
const _dirVector = new Vector3()
const _tempMatrix = new Matrix4()
const _alignVector = new Vector3(0, 1, 0)
const _zeroVector = new Vector3(0, 0, 0)
const _lookAtMatrix = new Matrix4()
const _unitX = new Vector3(1, 0, 0)
const _unitY = new Vector3(0, 1, 0)
const _unitZ = new Vector3(0, 0, 1)
const _v1 = new Vector3()
const _v2 = new Vector3()
const _v3 = new Vector3()

class TransformControlsRoot extends Object3D {
  isTransformControlsRoot: boolean
  controls: TTControls

  constructor(controls: TTControls) {
    super()
    this.isTransformControlsRoot = true
    this.controls = controls
    this.visible = false
  }

  /** 同步更新被控对象及其父节点的世界矩阵分解结果 */
  updateMatrixWorld(force: any) {
    const controls = this.controls
    if (controls.object !== undefined) {
      controls.object.updateMatrixWorld()
      if (controls.object.parent === null) {
        console.error('TTControls: 被控对象必须是场景图的一部分')
      } else {
        controls.object.parent.matrixWorld.decompose(controls._parentPosition, controls._parentQuaternion, controls._parentScale)
      }
      controls.object.matrixWorld.decompose(controls.worldPosition, controls.worldQuaternion, controls._worldScale)
      controls._parentQuaternionInv.copy(controls._parentQuaternion).invert()
      controls._worldQuaternionInv.copy(controls.worldQuaternion).invert()
    }
    controls.camera.updateMatrixWorld()
    controls.camera.matrixWorld.decompose(controls.cameraPosition, controls.cameraQuaternion, controls._cameraScale)
    if ("isOrthographicCamera" in controls.camera && controls.camera.isOrthographicCamera) {
      controls.camera.getWorldDirection(controls.eye).negate()
    } else {
      controls.eye.copy(controls.cameraPosition).sub(controls.worldPosition).normalize()
    }
    super.updateMatrixWorld(force)
  }

  dispose() {
    this.traverse(function (child: any) {
      if (child.geometry) child.geometry.dispose()
      if (child.material) child.material.dispose()
    })
  }
}

// ============================================================
// TransformControlsGizmo —— 手柄构建与每帧更新
// ============================================================

/** gizmo/picker 定义图的结构：{ 轴名: [[mesh, 位置?, 旋转?, 缩放?, 标签?], ...] } */
type GizmoMap = Record<string, [Mesh, (number[] | null)?, (number[] | null)?, (number[] | null)?, (string | undefined)?][]>

class TransformControlsGizmo extends Object3D {

  [key: string]: any
  type: string

  constructor() {
    super()
    this.isTransformControlsGizmo = true
    this.type = 'TransformControlsGizmo'

    // ============================================================
    // 材质工厂
    // ============================================================
    const gizmoMaterial = new MeshBasicMaterial({
      depthTest: false, depthWrite: false, fog: false, toneMapped: false, transparent: true,
    })
    const gizmoLineMaterial = new LineBasicMaterial({
      depthTest: false, depthWrite: false, fog: false, toneMapped: false, transparent: true,
    })

    const redColor = 0xEB4659
    const greenColor = 0x86CD35
    const blueColor = 0x3E8AEF
    const yellowColor = 0x00ffdd

    const matInvisible = gizmoMaterial.clone(); matInvisible.opacity = 0.15
    const matHelper = gizmoLineMaterial.clone(); matHelper.opacity = 0.5

    const matRed = gizmoMaterial.clone(); matRed.color.setHex(redColor)
    const matGreen = gizmoMaterial.clone(); matGreen.color.setHex(greenColor)
    const matBlue = gizmoMaterial.clone(); matBlue.color.setHex(blueColor)

    const matRedTransparent = gizmoMaterial.clone(); matRedTransparent.color.setHex(redColor); matRedTransparent.opacity = 0.5
    const matGreenTransparent = gizmoMaterial.clone(); matGreenTransparent.color.setHex(greenColor); matGreenTransparent.opacity = 0.5
    const matBlueTransparent = gizmoMaterial.clone(); matBlueTransparent.color.setHex(blueColor); matBlueTransparent.opacity = 0.5

    const matWhiteTransparent = gizmoMaterial.clone(); matWhiteTransparent.opacity = 0.25
    const matYellowTransparent = gizmoMaterial.clone(); matYellowTransparent.color.setHex(yellowColor); matYellowTransparent.opacity = 0.25
    const matYellow = gizmoMaterial.clone(); matYellow.color.setHex(yellowColor)
    const matGray = gizmoMaterial.clone(); matGray.color.setHex(0x787878)

    this.materialLib = {
      xAxis: matRed, yAxis: matGreen, zAxis: matBlue, active: matYellow,
      xAxisTransparent: matRedTransparent, yAxisTransparent: matGreenTransparent,
      zAxisTransparent: matBlueTransparent, activeTransparent: matYellowTransparent,
    }

    // ============================================================
    // 几何体工厂 —— 所有尺寸参数集中管理
    // ============================================================

    const ROTATE_TORUS_TUBE = 0.006        // 旋转环视觉管径（更细）
    const ROTATE_TORUS_ARC = Math.PI * 1.2 // 旋转环弧度
    const SCALE_BOX_SIZE = 0.05            // 缩放手柄方块视觉边长（更小）
    const TRANSLATE_LINE_LEN = 0.35        // 平移/缩放轴杆长度（更长）
    const ROTATE_TORUS_RADIUS = 0.20       // 旋转环半径
    const ROTATE_TORUS_ARC_HALF = 0.5      // 旋转环视觉弧度

    // 视觉 gizmo 几何体 —— 轴线更长更细，箭头更尖细
    const arrowGeo = new CylinderGeometry(0, 0.015, 0.065, 32); arrowGeo.translate(0, -0.15, 0)
    const scaleHandleGeo = new BoxGeometry(SCALE_BOX_SIZE, SCALE_BOX_SIZE, SCALE_BOX_SIZE); scaleHandleGeo.translate(0, -0.15, 0)
    const lineGeo = new BufferGeometry(); lineGeo.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 1, 0, 0], 3))
    const lineGeo2 = new CylinderGeometry(ROTATE_TORUS_TUBE, ROTATE_TORUS_TUBE, TRANSLATE_LINE_LEN, 32); lineGeo2.translate(0, TRANSLATE_LINE_LEN * 0.5, 0)

    // picker（不可见）几何体 —— 保持大尺寸不变，确保拾取精度
    const arrowPickGeo = new CylinderGeometry(0, 0.045, 0.065, 32); arrowPickGeo.translate(0, -0.15, 0)
    const linePickGeo = new CylinderGeometry(0.022, 0.022, 0.35, 32); linePickGeo.translate(0, 0.175, 0)
    const scaleHandlePickGeo = new BoxGeometry(0.10, 0.10, 0.10); scaleHandlePickGeo.translate(0, -0.15, 0)
    const planePickLen = 0.10
    const rotateTorusPickTube = 0.035

    // All 模式专用：分层轴线几何体 —— 平移最长、旋转居中、缩放最短
    const ALL_TRANS_LINE_LEN = 0.35     // 平移轴线最长，位于最外层
    const ALL_ROT_LINE_LEN = 0.25       // 旋转轴线居中
    const ALL_SCALE_LINE_LEN = 0.18     // 缩放轴线最短，位于最内层

    const allTransLineGeo = new CylinderGeometry(ROTATE_TORUS_TUBE, ROTATE_TORUS_TUBE, ALL_TRANS_LINE_LEN, 32)
    allTransLineGeo.translate(0, ALL_TRANS_LINE_LEN * 0.5, 0)
    const allRotLineGeo = new CylinderGeometry(ROTATE_TORUS_TUBE, ROTATE_TORUS_TUBE, ALL_ROT_LINE_LEN, 32)
    allRotLineGeo.translate(0, ALL_ROT_LINE_LEN * 0.5, 0)
    const allScaleLineGeo = new CylinderGeometry(ROTATE_TORUS_TUBE, ROTATE_TORUS_TUBE, ALL_SCALE_LINE_LEN, 32)
    allScaleLineGeo.translate(0, ALL_SCALE_LINE_LEN * 0.5, 0)

    const allTransLinePickGeo = new CylinderGeometry(0.022, 0.022, ALL_TRANS_LINE_LEN, 32)
    allTransLinePickGeo.translate(0, ALL_TRANS_LINE_LEN * 0.5, 0)
    const allRotLinePickGeo = new CylinderGeometry(0.022, 0.022, ALL_ROT_LINE_LEN, 32)
    allRotLinePickGeo.translate(0, ALL_ROT_LINE_LEN * 0.5, 0)
    const allScaleLinePickGeo = new CylinderGeometry(0.022, 0.022, ALL_SCALE_LINE_LEN, 32)
    allScaleLinePickGeo.translate(0, ALL_SCALE_LINE_LEN * 0.5, 0)

    // 中心点几何体
    const translateCenterGeo = new BoxGeometry(SCALE_BOX_SIZE, SCALE_BOX_SIZE, SCALE_BOX_SIZE)
    const translateCenterPickGeo = new BoxGeometry(0.15, 0.15, 0.15)
    const rotateCenterGeo = new SphereGeometry(0.035, 32, 16)
    const rotateCenterPickGeo = new SphereGeometry(0.10, 32, 16)
    const scaleCenterGeo = new BoxGeometry(SCALE_BOX_SIZE, SCALE_BOX_SIZE, SCALE_BOX_SIZE)
    const scaleCenterPickGeo = new BoxGeometry(0.15, 0.15, 0.15)

    const translateBoxPlaneLen = 0.07

    /** 旋转环辅助几何体工厂 */
    function circleGeo(radius: number, arc: number) {
      const g = new TorusGeometry(radius, ROTATE_TORUS_TUBE, 3, 64, ROTATE_TORUS_ARC, arc)
      g.rotateY(Math.PI / 2); g.rotateX(Math.PI / 2)
      return g
    }

    // ============================================================
    // Gizmo 定义图 —— 四个模式的数据
    // ============================================================

    // --- 平移模式 ---
    const gizmoTranslate: GizmoMap = {
      X: [
        [new Mesh(arrowGeo, matRed), [0.5, 0, 0], [0, 0, -Math.PI / 2]],
        [new Mesh(lineGeo2, matRed), [0, 0, 0], [0, 0, -Math.PI / 2]],
      ],
      Y: [
        [new Mesh(arrowGeo, matGreen), [0, 0.5, 0]],
        [new Mesh(lineGeo2, matGreen)],
      ],
      Z: [
        [new Mesh(arrowGeo, matBlue), [0, 0, 0.5], [Math.PI / 2, 0, 0]],
        [new Mesh(lineGeo2, matBlue), null, [Math.PI / 2, 0, 0]],
      ],
      XYZ: [[new Mesh(translateCenterGeo, matWhiteTransparent), [0, 0, 0]]],
      XY: [[new Mesh(new BoxGeometry(translateBoxPlaneLen, translateBoxPlaneLen, 0.01), matBlueTransparent), [0.15, 0.15, 0]]],
      YZ: [[new Mesh(new BoxGeometry(translateBoxPlaneLen, translateBoxPlaneLen, 0.01), matRedTransparent), [0, 0.15, 0.15], [0, Math.PI / 2, 0]]],
      XZ: [[new Mesh(new BoxGeometry(translateBoxPlaneLen, translateBoxPlaneLen, 0.01), matGreenTransparent), [0.15, 0, 0.15], [-Math.PI / 2, 0, 0]]],
    }

    const pickerTranslate: GizmoMap = {
      X: [
        [new Mesh(arrowPickGeo, matInvisible), [0.5, 0, 0], [0, 0, -Math.PI / 2]],
        [new Mesh(linePickGeo, matInvisible), [0, 0, 0], [0, 0, -Math.PI / 2]],
      ],
      Y: [
        [new Mesh(arrowPickGeo, matInvisible), [0, 0.5, 0]],
        [new Mesh(linePickGeo, matInvisible)],
      ],
      Z: [
        [new Mesh(arrowPickGeo, matInvisible), [0, 0, 0.5], [Math.PI / 2, 0, 0]],
        [new Mesh(linePickGeo, matInvisible), null, [Math.PI / 2, 0, 0]],
      ],
      XYZ: [[new Mesh(translateCenterPickGeo, matInvisible), [0, 0, 0]]],
      XY: [[new Mesh(new BoxGeometry(planePickLen, planePickLen, 0.01), matInvisible), [0.15, 0.15, 0]]],
      YZ: [[new Mesh(new BoxGeometry(planePickLen, planePickLen, 0.01), matInvisible), [0, 0.15, 0.15], [0, Math.PI / 2, 0]]],
      XZ: [[new Mesh(new BoxGeometry(planePickLen, planePickLen, 0.01), matInvisible), [0.15, 0, 0.15], [-Math.PI / 2, 0, 0]]],
    }

    // --- 旋转模式 ---
    const gizmoRotate: GizmoMap = {
      XYZE: [[new Mesh(rotateCenterGeo, matGray), null, [0, Math.PI / 2, 0]]],
      X: [[new Mesh(circleGeo(ROTATE_TORUS_RADIUS, ROTATE_TORUS_ARC_HALF), matRed)]],
      Y: [[new Mesh(circleGeo(ROTATE_TORUS_RADIUS, ROTATE_TORUS_ARC_HALF), matGreen), null, [0, 0, -Math.PI / 2]]],
      Z: [[new Mesh(circleGeo(ROTATE_TORUS_RADIUS, ROTATE_TORUS_ARC_HALF), matBlue), null, [0, Math.PI / 2, 0]]],
    }

    const pickerRotate: GizmoMap = {
      XYZE: [[new Mesh(rotateCenterPickGeo, matInvisible), [0, 0, 0], [0, Math.PI / 2, 0]]],
      X: [[new Mesh(new TorusGeometry(ROTATE_TORUS_RADIUS, rotateTorusPickTube, 4, 24, ROTATE_TORUS_ARC), matInvisible), [0, 0, 0], [0, -Math.PI / 2, -Math.PI / 2]]],
      Y: [[new Mesh(new TorusGeometry(ROTATE_TORUS_RADIUS, rotateTorusPickTube, 4, 24, ROTATE_TORUS_ARC), matInvisible), [0, 0, 0], [Math.PI / 2, 0, 0]]],
      Z: [[new Mesh(new TorusGeometry(ROTATE_TORUS_RADIUS, rotateTorusPickTube, 4, 24, ROTATE_TORUS_ARC), matInvisible), [0, 0, 0], [0, 0, -Math.PI / 2]]],
    }

    // --- 缩放模式 ---
    const gizmoScale: GizmoMap = {
      X: [
        [new Mesh(scaleHandleGeo, matRed), [0.5, 0, 0], [0, 0, -Math.PI / 2]],
        [new Mesh(lineGeo2, matRed), [0, 0, 0], [0, 0, -Math.PI / 2]],
      ],
      Y: [
        [new Mesh(scaleHandleGeo, matGreen), [0, 0.5, 0]],
        [new Mesh(lineGeo2, matGreen)],
      ],
      Z: [
        [new Mesh(scaleHandleGeo, matBlue), [0, 0, 0.5], [Math.PI / 2, 0, 0]],
        [new Mesh(lineGeo2, matBlue), [0, 0, 0], [Math.PI / 2, 0, 0]],
      ],
      XY: [[new Mesh(new BoxGeometry(SCALE_BOX_SIZE, SCALE_BOX_SIZE, 0.01), matBlueTransparent), [0.15, 0.15, 0]]],
      YZ: [[new Mesh(new BoxGeometry(SCALE_BOX_SIZE, SCALE_BOX_SIZE, 0.01), matRedTransparent), [0, 0.15, 0.15], [0, Math.PI / 2, 0]]],
      XZ: [[new Mesh(new BoxGeometry(SCALE_BOX_SIZE, SCALE_BOX_SIZE, 0.01), matGreenTransparent), [0.15, 0, 0.15], [-Math.PI / 2, 0, 0]]],
      XYZ: [[new Mesh(scaleCenterGeo, matWhiteTransparent), [0, 0, 0]]],
    }

    const pickerScale: GizmoMap = {
      X: [
        [new Mesh(scaleHandlePickGeo, matRed), [0.5, 0, 0], [0, 0, -Math.PI / 2]],
        [new Mesh(linePickGeo, matInvisible), [0, 0, 0], [0, 0, -Math.PI / 2]],
      ],
      Y: [
        [new Mesh(scaleHandlePickGeo, matGreen), [0, 0.5, 0]],
        [new Mesh(linePickGeo, matInvisible)],
      ],
      Z: [
        [new Mesh(scaleHandlePickGeo, matBlue), [0, 0, 0.5], [Math.PI / 2, 0, 0]],
        [new Mesh(linePickGeo, matInvisible), [0, 0, 0], [Math.PI / 2, 0, 0]],
      ],
      XY: [[new Mesh(new BoxGeometry(planePickLen, planePickLen, 0.01), matInvisible), [0.15, 0.15, 0]]],
      YZ: [[new Mesh(new BoxGeometry(planePickLen, planePickLen, 0.01), matInvisible), [0, 0.15, 0.15], [0, Math.PI / 2, 0]]],
      XZ: [[new Mesh(new BoxGeometry(planePickLen, planePickLen, 0.01), matInvisible), [0.15, 0, 0.15], [-Math.PI / 2, 0, 0]]],
      XYZ: [[new Mesh(scaleCenterPickGeo, matInvisible), [0, 0, 0]]],
    }

    // --- All 模式：整合平移+旋转+缩放在同一 gizmo 中 ---
    // 命名规则：前缀 t_ = 平移, r_ = 旋转, s_ = 缩放
    // All 模式下只保留三个轴线的操作手柄，隐藏轴面（XY/YZ/XZ）及独立中心点
    // 轴线分层：平移最长（最外层）、旋转居中、缩放最短（最内层）

    // gizmoAll：只含每个模式的三个轴线 + 分层轴线 + 旋转环
    const gizmoAll: GizmoMap = {
      // 平移层 —— 轴线最长，位于最外层
      t_X: [
        [new Mesh(arrowGeo, matRed), [0.5, 0, 0], [0, 0, -Math.PI / 2]],
        [new Mesh(allTransLineGeo, matRed), [0, 0, 0], [0, 0, -Math.PI / 2]],
      ],
      t_Y: [
        [new Mesh(arrowGeo, matGreen), [0, 0.5, 0]],
        [new Mesh(allTransLineGeo, matGreen)],
      ],
      t_Z: [
        [new Mesh(arrowGeo, matBlue), [0, 0, 0.5], [Math.PI / 2, 0, 0]],
        [new Mesh(allTransLineGeo, matBlue), null, [Math.PI / 2, 0, 0]],
      ],
      // 旋转层 —— 轴线居中 + 旋转环
      r_X: [
        [new Mesh(circleGeo(ROTATE_TORUS_RADIUS, ROTATE_TORUS_ARC_HALF), matRed)],
        [new Mesh(allRotLineGeo, matRed), [0, 0, 0], [0, 0, -Math.PI / 2]],
      ],
      r_Y: [
        [new Mesh(circleGeo(ROTATE_TORUS_RADIUS, ROTATE_TORUS_ARC_HALF), matGreen), null, [0, 0, -Math.PI / 2]],
        [new Mesh(allRotLineGeo, matGreen)],
      ],
      r_Z: [
        [new Mesh(circleGeo(ROTATE_TORUS_RADIUS, ROTATE_TORUS_ARC_HALF), matBlue), null, [0, Math.PI / 2, 0]],
        [new Mesh(allRotLineGeo, matBlue), null, [Math.PI / 2, 0, 0]],
      ],
      // 缩放层 —— 轴线最短，位于最内层
      s_X: [
        [new Mesh(scaleHandleGeo, matRed), [0.35, 0, 0], [0, 0, -Math.PI / 2]],
        [new Mesh(allScaleLineGeo, matRed), [0, 0, 0], [0, 0, -Math.PI / 2]],
      ],
      s_Y: [
        [new Mesh(scaleHandleGeo, matGreen), [0, 0.35, 0]],
        [new Mesh(allScaleLineGeo, matGreen)],
      ],
      s_Z: [
        [new Mesh(scaleHandleGeo, matBlue), [0, 0, 0.35], [Math.PI / 2, 0, 0]],
        [new Mesh(allScaleLineGeo, matBlue), [0, 0, 0], [Math.PI / 2, 0, 0]],
      ],
    }

    // pickerAll：对应的不可见拾取层
    const pickerAll: GizmoMap = {
      t_X: [
        [new Mesh(arrowPickGeo, matInvisible), [0.5, 0, 0], [0, 0, -Math.PI / 2]],
        [new Mesh(allTransLinePickGeo, matInvisible), [0, 0, 0], [0, 0, -Math.PI / 2]],
      ],
      t_Y: [
        [new Mesh(arrowPickGeo, matInvisible), [0, 0.5, 0]],
        [new Mesh(allTransLinePickGeo, matInvisible)],
      ],
      t_Z: [
        [new Mesh(arrowPickGeo, matInvisible), [0, 0, 0.5], [Math.PI / 2, 0, 0]],
        [new Mesh(allTransLinePickGeo, matInvisible), null, [Math.PI / 2, 0, 0]],
      ],
      r_X: [
        [new Mesh(new TorusGeometry(ROTATE_TORUS_RADIUS, rotateTorusPickTube, 4, 24, ROTATE_TORUS_ARC), matInvisible), [0, 0, 0], [0, -Math.PI / 2, -Math.PI / 2]],
        [new Mesh(allRotLinePickGeo, matInvisible), [0, 0, 0], [0, 0, -Math.PI / 2]],
      ],
      r_Y: [
        [new Mesh(new TorusGeometry(ROTATE_TORUS_RADIUS, rotateTorusPickTube, 4, 24, ROTATE_TORUS_ARC), matInvisible), [0, 0, 0], [Math.PI / 2, 0, 0]],
        [new Mesh(allRotLinePickGeo, matInvisible)],
      ],
      r_Z: [
        [new Mesh(new TorusGeometry(ROTATE_TORUS_RADIUS, rotateTorusPickTube, 4, 24, ROTATE_TORUS_ARC), matInvisible), [0, 0, 0], [0, 0, -Math.PI / 2]],
        [new Mesh(allRotLinePickGeo, matInvisible), null, [Math.PI / 2, 0, 0]],
      ],
      s_X: [
        [new Mesh(scaleHandlePickGeo, matRed), [0.35, 0, 0], [0, 0, -Math.PI / 2]],
        [new Mesh(allScaleLinePickGeo, matInvisible), [0, 0, 0], [0, 0, -Math.PI / 2]],
      ],
      s_Y: [
        [new Mesh(scaleHandlePickGeo, matGreen), [0, 0.35, 0]],
        [new Mesh(allScaleLinePickGeo, matInvisible)],
      ],
      s_Z: [
        [new Mesh(scaleHandlePickGeo, matBlue), [0, 0, 0.35], [Math.PI / 2, 0, 0]],
        [new Mesh(allScaleLinePickGeo, matInvisible), [0, 0, 0], [Math.PI / 2, 0, 0]],
      ],
    }

    // ============================================================
    // setupGizmo 构建器
    // ============================================================

    /** 将 GizmoMap 定义编译为 Object3D 子树 */
    function setupGizmo(gizmoMap: GizmoMap): Object3D {
      const container = new Object3D()
      for (const name in gizmoMap) {
        for (let i = gizmoMap[name].length; i--;) {
          const object = gizmoMap[name][i][0].clone()
          const position = gizmoMap[name][i][1]
          const rotation = gizmoMap[name][i][2]
          const scale = gizmoMap[name][i][3]
          const tag = gizmoMap[name][i][4]

          object.name = name
          ;(object as any).tag = tag

          if (position) object.position.set(position[0], position[1], position[2])
          if (rotation) object.rotation.set(rotation[0], rotation[1], rotation[2])
          if (scale) object.scale.set(scale[0], scale[1], scale[2])

          object.updateMatrix()
          const tempGeo = object.geometry.clone()
          tempGeo.applyMatrix4(object.matrix)
          object.geometry = tempGeo
          object.renderOrder = Infinity
          object.position.set(0, 0, 0)
          object.rotation.set(0, 0, 0)
          object.scale.set(1, 1, 1)

          container.add(object)
        }
      }
      return container
    }

    // ============================================================
    // 构建所有 gizmo / picker
    // ============================================================

    this.gizmo = {} as Record<string, Object3D>
    this.picker = {} as Record<string, Object3D>
    this.helper = {} as Record<string, Object3D>

    this.gizmo['translate'] = setupGizmo(gizmoTranslate); this.add(this.gizmo['translate'])
    this.gizmo['rotate'] = setupGizmo(gizmoRotate); this.add(this.gizmo['rotate'])
    this.gizmo['scale'] = setupGizmo(gizmoScale); this.add(this.gizmo['scale'])
    this.gizmo['all'] = setupGizmo(gizmoAll); this.add(this.gizmo['all'])

    this.picker['translate'] = setupGizmo(pickerTranslate); this.add(this.picker['translate'])
    this.picker['rotate'] = setupGizmo(pickerRotate); this.add(this.picker['rotate'])
    this.picker['scale'] = setupGizmo(pickerScale); this.add(this.picker['scale'])
    this.picker['all'] = setupGizmo(pickerAll); this.add(this.picker['all'])

    this.picker['translate'].visible = false
    this.picker['rotate'].visible = false
    this.picker['scale'].visible = false
    this.picker['all'].visible = false
  }

  // ============================================================
  // 每帧更新 —— 可见性、位置、旋转、高亮
  // ============================================================

  updateMatrixWorld(force: any) {
    const mode = this.mode
    // scale 模式始终使用 local 空间
    const space = (mode === 'scale') ? 'local' : this.space
    const quaternion = (space === 'local') ? this.worldQuaternion : _identityQuaternion

    // 只显示当前模式的 gizmo
    this.gizmo['translate'].visible = mode === 'translate'
    this.gizmo['rotate'].visible = mode === 'rotate'
    this.gizmo['scale'].visible = mode === 'scale'
    this.gizmo['all'].visible = mode === 'all'

    /** 获取当前模式实际用于渲染的 handles 列表 */
    function _activeHandles(thisGizmo: any, m: TransformControlsMode): Mesh[] {
      const handles: Mesh[] = []
      handles.push(...(thisGizmo.picker[m].children as Mesh[]))
      handles.push(...(thisGizmo.gizmo[m].children as Mesh[]))
      return handles
    }

    const handles = _activeHandles(this, mode)

    for (let i = 0; i < handles.length; i++) {
      const handle = handles[i]

      handle.visible = true
      handle.rotation.set(0, 0, 0)
      handle.position.copy(this.worldPosition)

      let factor: number
      if (this.camera.isOrthographicCamera) {
        factor = (this.camera.top - this.camera.bottom) / this.camera.zoom
      } else {
        factor = this.worldPosition.distanceTo(this.cameraPosition) * Math.min(1.9 * Math.tan(Math.PI * this.camera.fov / 360) / this.camera.zoom, 7)
      }
      handle.scale.set(1, 1, 1).multiplyScalar(factor * this.size / 4)

      // helper 分支（当前未使用，保留占位）
      const handleAny = handle as any
      if (handleAny.tag === 'helper') {
        handle.visible = false
        continue
      }

      // 读取纯轴名（去掉 All 模式前缀）
      const rawName: string = handle.name
      let pureName = rawName
      if (mode === 'all' && rawName.length > 2 && rawName.charAt(1) === '_') {
        pureName = rawName.substring(2)
      }

      // 对齐旋转
      handle.quaternion.copy(quaternion)

      // All 模式下根据前缀区分平移/缩放层（需隐藏轴）和旋转层（需对齐环朝向）
      // 因 All 模式不含轴面，其 translate/scale 层只需处理单轴 X/Y/Z 的隐藏
      const allIsTransScale = mode === 'all' && (rawName.startsWith('t_') || rawName.startsWith('s_'))
      const allIsRot = mode === 'all' && rawName.startsWith('r_')

      if (mode === 'translate' || mode === 'scale' || allIsTransScale) {
        // 平移/缩放模式及 All 模式中的平移&缩放元素：隐藏面向相机的轴
        const AXIS_HIDE_THRESHOLD = 0.99

        if (pureName === 'X') {
          if (Math.abs(_alignVector.copy(_unitX).applyQuaternion(quaternion).dot(this.eye)) > AXIS_HIDE_THRESHOLD) {
            handle.scale.set(1e-10, 1e-10, 1e-10); handle.visible = false
          }
        } else if (pureName === 'Y') {
          if (Math.abs(_alignVector.copy(_unitY).applyQuaternion(quaternion).dot(this.eye)) > AXIS_HIDE_THRESHOLD) {
            handle.scale.set(1e-10, 1e-10, 1e-10); handle.visible = false
          }
        } else if (pureName === 'Z') {
          if (Math.abs(_alignVector.copy(_unitZ).applyQuaternion(quaternion).dot(this.eye)) > AXIS_HIDE_THRESHOLD) {
            handle.scale.set(1e-10, 1e-10, 1e-10); handle.visible = false
          }
        }
        // 仅在独立平移/缩放模式处理平面隐藏（All 模式不含平面）
        if (mode !== 'all') {
          const PLANE_HIDE_THRESHOLD = 0.2
          if (pureName === 'XY') {
            if (Math.abs(_alignVector.copy(_unitZ).applyQuaternion(quaternion).dot(this.eye)) < PLANE_HIDE_THRESHOLD) {
              handle.scale.set(1e-10, 1e-10, 1e-10); handle.visible = false
            }
          } else if (pureName === 'YZ') {
            if (Math.abs(_alignVector.copy(_unitX).applyQuaternion(quaternion).dot(this.eye)) < PLANE_HIDE_THRESHOLD) {
              handle.scale.set(1e-10, 1e-10, 1e-10); handle.visible = false
            }
          } else if (pureName === 'XZ') {
            if (Math.abs(_alignVector.copy(_unitY).applyQuaternion(quaternion).dot(this.eye)) < PLANE_HIDE_THRESHOLD) {
              handle.scale.set(1e-10, 1e-10, 1e-10); handle.visible = false
            }
          }
        }
      } else if (mode === 'rotate' || allIsRot) {
        // 旋转模式及 All 模式中的旋转元素：对齐旋转环朝向
        _tempQuaternion2.copy(quaternion)
        _alignVector.copy(this.eye).applyQuaternion(_tempQuaternion.copy(quaternion).invert())

        if (pureName.search('E') !== -1) {
          handle.quaternion.setFromRotationMatrix(_lookAtMatrix.lookAt(this.eye, _zeroVector, _unitY))
        }
        if (pureName === 'X') {
          _tempQuaternion.setFromAxisAngle(_unitX, Math.atan2(-_alignVector.y, _alignVector.z))
          _tempQuaternion.multiplyQuaternions(_tempQuaternion2, _tempQuaternion)
          handle.quaternion.copy(_tempQuaternion)
        }
        if (pureName === 'Y') {
          _tempQuaternion.setFromAxisAngle(_unitY, Math.atan2(_alignVector.x, _alignVector.z))
          _tempQuaternion.multiplyQuaternions(_tempQuaternion2, _tempQuaternion)
          handle.quaternion.copy(_tempQuaternion)
        }
        if (pureName === 'Z') {
          _tempQuaternion.setFromAxisAngle(_unitZ, Math.atan2(_alignVector.y, _alignVector.x))
          _tempQuaternion.multiplyQuaternions(_tempQuaternion2, _tempQuaternion)
          handle.quaternion.copy(_tempQuaternion)
        }
      }

      // 隐藏被禁用的轴
      handle.visible = handle.visible && (pureName.indexOf('X') === -1 || this.showX)
      handle.visible = handle.visible && (pureName.indexOf('Y') === -1 || this.showY)
      handle.visible = handle.visible && (pureName.indexOf('Z') === -1 || this.showZ)
      handle.visible = handle.visible && (pureName.indexOf('E') === -1 || (this.showX && this.showY && this.showZ))

      // 高亮当前选中轴
      const material = handle.material as (MeshBasicMaterial & { _color: Color; _opacity: number })
      material._color = material._color || material.color.clone()
      material._opacity = material._opacity || material.opacity
      material.color.copy(material._color)
      material.opacity = material._opacity

      if (this.enabled && this.axis) {
        const axisStr = this.axis as string
        if (mode === 'all') {
          // All 模式：匹配原始命名（含前缀）
          if (rawName === axisStr) {
            material.color.copy(this.materialLib.active.color)
            material.opacity = 1.0
          }
        } else {
          if (handle.name === axisStr) {
            material.opacity = 1.0
          } else if (axisStr.split('').some(a => handle.name === a)) {
            material.opacity = 1.0
          }
        }
      }
    }

    super.updateMatrixWorld(force)
  }
}

// ============================================================
// TransformControlsPlane —— 操作平面
// ============================================================

class TransformControlsPlane extends Mesh {
  [key: string]: any
  type: string = ""

  constructor() {
    super(
      new PlaneGeometry(100000, 100000, 2, 2),
      new MeshBasicMaterial({ visible: false, wireframe: true, side: DoubleSide, transparent: true, opacity: 0.1, toneMapped: false }),
    )
    this.isTransformControlsPlane = true
    this.type = 'TransformControlsPlane'
  }

  updateMatrixWorld(force: any) {
    let space = this.space
    this.position.copy(this.worldPosition)
    if (this.mode === 'scale') space = 'local'

    _v1.copy(_unitX).applyQuaternion(space === 'local' ? this.worldQuaternion : _identityQuaternion)
    _v2.copy(_unitY).applyQuaternion(space === 'local' ? this.worldQuaternion : _identityQuaternion)
    _v3.copy(_unitZ).applyQuaternion(space === 'local' ? this.worldQuaternion : _identityQuaternion)

    _alignVector.copy(_v2)

    // 根据模式和轴决定平面对齐方向
    let axis = this.axis as string | null
    const mode = this.mode as TransformControlsMode

    // All 模式下 axis 带前缀（如 "t_X"），提取纯轴名用于平面方向判断
    if (mode === 'all' && axis && axis.length > 2 && axis.charAt(1) === '_') {
      axis = axis.substring(2)
    }

    if (mode === 'translate' || mode === 'scale' || mode === 'all') {
      if (axis) {
        switch (axis) {
          case 'X': _alignVector.copy(this.eye).cross(_v1); _dirVector.copy(_v1).cross(_alignVector); break
          case 'Y': _alignVector.copy(this.eye).cross(_v2); _dirVector.copy(_v2).cross(_alignVector); break
          case 'Z': _alignVector.copy(this.eye).cross(_v3); _dirVector.copy(_v3).cross(_alignVector); break
          case 'XY': _dirVector.copy(_v3); break
          case 'YZ': _dirVector.copy(_v1); break
          case 'XZ': _alignVector.copy(_v3); _dirVector.copy(_v2); break
          case 'XYZ':
          case 'E': _dirVector.set(0, 0, 0); break
          default: _dirVector.set(0, 0, 0)
        }
      } else {
        _dirVector.set(0, 0, 0)
      }
    } else if (mode === 'rotate') {
      _dirVector.set(0, 0, 0)
    }

    if (_dirVector.length() === 0) {
      this.quaternion.copy(this.cameraQuaternion)
    } else {
      _tempMatrix.lookAt(_tempVector.set(0, 0, 0), _dirVector, _alignVector)
      this.quaternion.setFromRotationMatrix(_tempMatrix)
    }

    super.updateMatrixWorld(force)
  }
}

export { TTControls, TransformControlsGizmo, TransformControlsPlane }