import camelcase from 'camelcase'
import { IPropDef, ISwaggerOptions } from '../baseInterfaces'
import { toBaseType } from '../utils'

const baseTypes = ['string', 'number', 'object', 'boolean', 'any']

/** 类模板 */
export function interfaceTemplate(
  name: string,
  props: IPropDef[],
  imports: string[],
  strictNullChecks: boolean = true
) {
  // 所有的引用
  const importString = imports
    .map(imp => {
      return `import { ${imp} } from '../definitions/${imp}'\n`
    })
    .join('')

  return `
  ${importString}

  export interface ${name} {

    ${props.map(p => classPropsTemplate(p.name, p.type, p.format, p.desc, !strictNullChecks, false, false)).join('')}
  }
  `
}

/** 类模板 */
export function classTemplate(
  name: string,
  props: IPropDef[],
  imports: string[],
  strictNullChecks: boolean = true,
  useClassTransformer: boolean,
  generateValidationModel: boolean
) {
  // 所有的引用
  const mappedImports = imports.map(imp => {
    return `import { ${imp} } from '../definitions/${imp}'\n`
  })

  if (useClassTransformer && imports.length > 0) {
    mappedImports.push(`import { Type, Transform, Expose } from 'class-transformer'\n`)
  }
  const importString = mappedImports.join('')

  return `
  ${importString}

  export class ${name} {

    ${props
      .map(p =>
        classPropsTemplate(
          p.name,
          p.type,
          p.format,
          p.desc,
          !strictNullChecks,
          useClassTransformer,
          p.isEnum || p.isType
        )
      )
      .join('')}

    constructor(data: (undefined | any) = {}){
        ${props.map(p => classConstructorTemplate(p.name)).join('')}
    }
    ${generateValidationModel ? classValidationModelTemplate(props) : ''}
  }
  `
}

/** 类属性模板 */
export function classPropsTemplate(
  filedName: string,
  type: string,
  format: string,
  description: string,
  canNull: boolean,
  useClassTransformer: boolean,
  isType: boolean
) {
  /**
   * eg:
   *   //description
   *   fieldName: type
   */
  type = toBaseType(type, format)
  if (useClassTransformer) {
    const decorators = classTransformTemplate(type, format, isType)

    return `
  /** ${description || ''} */
  ${decorators}
  '${filedName}'${canNull ? '?' : ''}:${type};
  `
  } else {
    return `
  /** ${description || ''} */
  '${filedName}'${canNull ? '?' : ''}:${type};
  `
  }
}

export function propValidationModelTemplate(filedName: string, validationModel: object) {
  /**
   * eg:
   *   fieldName: { required: true, maxLength: 50 }
   */
  return `'${filedName}':${JSON.stringify(validationModel)}`
}

export function classValidationModelTemplate(props: IPropDef[]) {
  /**
   * eg:
   *   public static validationModel = { .. }
   */
  return `
    public static validationModel = {
      ${props
      .filter(p => p.validationModel !== null)
      .map(p => propValidationModelTemplate(p.name, p.validationModel))
      .join(',\n')}
    }
  `
}

export function classTransformTemplate(type: string, format: string, isType: boolean) {
  const decorators: string[] = [`@Expose()`]
  const nonArrayType = type.replace('[', '').replace(']', '')
  /* ignore interfaces */
  if (baseTypes.indexOf(nonArrayType) < 0 && !isType) {
    decorators.push(`@Type(() => ${nonArrayType})`)
  }
  return decorators.join('\n')
}

/** 类属性模板 */
export function classConstructorTemplate(name: string) {
  return `this['${name}'] = data['${name}'];\n`
}

/** 枚举 */
export function enumTemplate(name: string, enumString: string, prefix?: string) {
  return `
  export enum ${name}{
    ${enumString}
  }
  `
}

export function typeTemplate(name: string, typeString: string, prefix?: string) {
  return `
  export type ${name} = ${typeString};
  `
}

interface IRequestSchema {
  summary: string
  parameters: string
  responseType: string
  method: string
  contentType: string
  path: string
  pathReplace: string
  parsedParameters: any
  formData: string
  requestBody: any
}

/** requestTemplate */
export function requestTemplate(name: string, requestSchema: IRequestSchema, options: any) {
  let {
    summary = '',
    parameters = '',
    responseType = '',
    method = '',
    path = '', } = requestSchema
  path = path.replace(/{[^}]+}/, '');
  return `
/**
 * ${summary || ''}
 */
${options.useStaticMethod ? 'static' : ''} ${camelcase(name)}(${parameters}):Observable<${responseType}> {
  let url = '${path}'
  ${optionsStr(method, parameters)}
  return this.http.request("${method}", url, options) as any as Observable<${responseType}>;
}`
}

/** serviceTemplate */
export function serviceTemplate(name: string, body: string) {
  return `
  @Injectable({ providedIn: 'root' })
  export class ${name} {
      constructor(private http: HttpClient) {}
      ${body}
  } 
  `
}

export function optionsStr(method: string, parameters: string): string {
  if (method == "get") {
    if (parameters)
      return `const _copy: any = {...params}
      let options : any = {
          params: new HttpParams({ fromObject: _copy }),
          method: "${method}"
      };`
    else
      return `let options : any = {
        method: "${method}"
      };`
  }
  else if (method == "put") {
    return `let options : any = {
      params: { id: params.id },
      body: params.body,
      method: "${method}"
      };`
  }
  else if (method == "delete") {
    return `let options : any = {
      params: { id: params.id },
      method: "${method}"
      };`
  }
  else if (method == "post") {
    return `let options : any = {
      body: params.body,
      method: "${method}"
      };`
  }
}
