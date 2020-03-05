import * as fs from 'fs'
import * as path from 'path'
import { ISwaggerOptions } from "../baseInterfaces";
import { abpGenericTypeDefinition, universalGenericTypeDefinition } from './genericTypeDefinitionTemplate';

export function serviceHeader(options: ISwaggerOptions) {
  const classTransformerImport = options.useClassTransformer
    ? `import { Expose, Transform, Type, plainToClass } from 'class-transformer';
  ` : '';
  return `/** Generate by swagger-axios-codegen */
  // tslint:disable
  /* eslint-disable */
  import { Injectable } from '@angular/core';
  import { Observable } from 'rxjs';
  import { HttpClient } from '@angular/common/http';

  ${classTransformerImport}

  ${definitionHeader(options.extendDefinitionFile)}
  `;
}

export function customerServiceHeader(options: ISwaggerOptions) {

  return `/** Generate by swagger-axios-codegen */
  // tslint:disable
  /* eslint-disable */

  ${definitionHeader(options.extendDefinitionFile)}
  `
}

function definitionHeader(fileDir: string | undefined) {
  let fileStr = '// empty '
  if (!!fileDir) {
    console.log('extendDefinitionFile url : ', path.resolve(fileDir))
    if (fs.existsSync(path.resolve(fileDir))) {
      const buffs = fs.readFileSync(path.resolve(fileDir))
      fileStr = buffs.toString('utf8')
    }
  }

  return `
  ${universalGenericTypeDefinition()}
  ${abpGenericTypeDefinition()}
  // customer definition
  ${fileStr}
  `
}
