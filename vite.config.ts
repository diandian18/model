import path from 'path';
import { defineConfig, UserConfigExport } from 'vite';
import dts from 'vite-plugin-dts';
import terser from '@rollup/plugin-terser';

// https://vitejs.dev/config/

/**
 * npm run build:test
 * npm run build:lib
 */
enum Mode {
  /**
   * 库模式，其他为不同环境下的demo模式
   */
  'LIB' = 'lib',
  'PROD' = 'prod',
}

interface ViteParams {
  mode: string;
  command: string;
  ssrBuild: boolean;
}

export default (viteParams: ViteParams) => {
  const { mode } = viteParams;
  // console.log(mode); // { mode: 'localhost', command: 'serve', ssrBuild: false }
  const config: UserConfigExport = {
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@@': path.resolve(__dirname, './examples'),
      },
    },
    server: {
      host: true,
      port: 9528,
    },
    esbuild: {
      target: 'chrome65',
    },
    build: {
      target: 'es2015',
    },
  };

  if (mode === Mode.LIB) {
    // 生成类型文件
    const dstConfig = dts({
      outDir: './dist-lib',
      insertTypesEntry: true,
      // skipDiagnostics: true,
      rollupTypes: true,
      exclude: ['examples'],
    });
    if (config.plugins) {
      config.plugins.push(dstConfig);
    } else {
      config.plugins = [dstConfig];
    }

    // 构建打包
    if (config.build) {
      // 库模式打包
      config.build.lib = {
        entry: path.resolve(__dirname, 'src/index.ts'),
        name: 'Model', // umd中变量名称
        fileName: 'index', // 打包后的dist里文件名称
      };
      // rollup配置
      config.build.rollupOptions = {
        output: {
          inlineDynamicImports: true,
          dir: './dist-lib',
          plugins: [terser()],
          globals: {
            'react': 'React',
          },
        },
        external: ['react'],
      };
    }
  }

  return defineConfig(config);
};
