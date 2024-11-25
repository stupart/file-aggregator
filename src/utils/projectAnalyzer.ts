// src/utils/projectAnalyzer.ts
import * as fs from 'fs/promises';
import * as path from 'path';
import { ProjectContext, ProjectStack } from '../types';

interface PackageJson {
    name: string;
    description?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
}

async function readPackageJson(rootPath: string): Promise<PackageJson> {
    try {
        const content = await fs.readFile(path.join(rootPath, 'package.json'), 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.error('Error reading package.json:', error);
        return { name: path.basename(rootPath) };
    }
}

function detectProjectType(packageJson: PackageJson): ProjectStack['type'] {
    const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
    };

    if (allDeps['electron']) return 'electron';
    if (allDeps['react']) return 'react';
    if (allDeps['vue']) return 'vue';
    if (allDeps['@angular/core']) return 'angular';
    if (allDeps['express'] || allDeps['koa'] || allDeps['fastify']) return 'node';
    
    return 'unknown';
}

function detectFrameworks(packageJson: PackageJson): string[] {
    const frameworks: string[] = [];
    const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
    };

    // UI Frameworks
    if (allDeps['@mui/material']) frameworks.push('material-ui');
    if (allDeps['tailwindcss']) frameworks.push('tailwind');
    if (allDeps['@chakra-ui/react']) frameworks.push('chakra-ui');

    // State Management
    if (allDeps['redux'] || allDeps['@reduxjs/toolkit']) frameworks.push('redux');
    if (allDeps['mobx']) frameworks.push('mobx');
    if (allDeps['recoil']) frameworks.push('recoil');

    return frameworks;
}

async function detectLanguage(rootPath: string): Promise<ProjectStack['language']> {
    try {
        const files = await fs.readdir(rootPath);
        const hasTS = files.some(f => f.endsWith('.ts') || f.endsWith('.tsx'));
        const hasJS = files.some(f => f.endsWith('.js') || f.endsWith('.jsx'));
        
        if (hasTS && hasJS) return 'mixed';
        if (hasTS) return 'typescript';
        return 'javascript';
    } catch {
        return 'javascript';
    }
}

function detectTestingLibraries(packageJson: PackageJson): string[] {
    const testingTools: string[] = [];
    const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
    };

    if (allDeps['jest']) testingTools.push('jest');
    if (allDeps['@testing-library/react']) testingTools.push('react-testing-library');
    if (allDeps['cypress']) testingTools.push('cypress');
    if (allDeps['vitest']) testingTools.push('vitest');

    return testingTools;
}

function detectStylingApproach(packageJson: PackageJson, rootPath: string): string[] {
    const stylingTools: string[] = [];
    const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
    };

    if (allDeps['styled-components']) stylingTools.push('styled-components');
    if (allDeps['@emotion/react']) stylingTools.push('emotion');
    if (allDeps['sass']) stylingTools.push('sass');
    if (allDeps['tailwindcss']) stylingTools.push('tailwind');

    return stylingTools;
}

function detectBuildTools(packageJson: PackageJson): string[] {
    const buildTools: string[] = [];
    const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
    };

    if (allDeps['webpack']) buildTools.push('webpack');
    if (allDeps['vite']) buildTools.push('vite');
    if (allDeps['parcel']) buildTools.push('parcel');
    if (allDeps['esbuild']) buildTools.push('esbuild');

    return buildTools;
}

export async function analyzeProject(rootPath: string): Promise<ProjectContext> {
    const packageJson = await readPackageJson(rootPath);
    
    const stack: ProjectStack = {
        type: detectProjectType(packageJson),
        framework: detectFrameworks(packageJson),
        language: await detectLanguage(rootPath),
        testing: detectTestingLibraries(packageJson),
        styling: detectStylingApproach(packageJson, rootPath),
        buildTools: detectBuildTools(packageJson)
    };

    return {
        name: packageJson.name,
        description: packageJson.description || '',
        stack,
        dependencies: {
            prod: packageJson.dependencies || {},
            dev: packageJson.devDependencies || {}
        },
        scripts: packageJson.scripts || {}
    };
}