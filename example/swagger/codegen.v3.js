// const { codegen } = require('swagger-axios-codegen')
const { codegen } = require('../../dist/index.js')

codegen({
  methodNameMode: 'path',
  remoteUrl: 'http://192.168.3.50:44340/swagger/v1/swagger.json',
  outputDir: './src/api',
  fileName: 'appService.ts',
  useStaticMethod: false,
  strictNullChecks: false,
  modelMode: 'interface',
  serviceNameSuffix: 'ProxyService',
  exclude: ['AbpApiDefinition', 'AbpLanguages', 'AbpApplicationConfiguration']
})
