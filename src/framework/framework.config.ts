import { Container } from 'inversify';
import { FrameworkArguments } from '../framework-arguments';
import { TestRunner } from '../test-runner';
import { Configuration } from './configuration/configuration';
import { SourcesType } from './configuration/sources-type.enum';
import { FrameworkFunctionality } from './framework-functionality.config';
import { FrameworkTags } from './framework-tags.config';
import { IGenerator } from './generator/interfaces/generator.interface';
import { GenerateableTypes } from './generator/model/generateable-types.enum';
import { ProductGenerator } from './generator/types/product-generator';
import { StepDefinitionsGenerator } from './generator/types/step-definition-generator';
import { FeatureGenerator } from './generator/types/feature-generator';
import { EnvironmentGenerator } from './generator/types/environment-generator';
import { VariantGenerator } from './generator/types/variant-generator';
import { TestAreaGenerator } from './generator/types/test-area-generator';
import MochaBddCompiler, { MochaReporterParams } from './gherkin/mocha/mocha-bdd-compiler';
import { MochaCompiler } from './gherkin/mocha/mocha-compiler.abstract';
import { MochaVanillaCompiler } from './gherkin/mocha/mocha-vanilla-compiler';
import { LogicModelGenerator } from './generator/types/logic-model-generator';
import { PageObjectModelGenerator } from './generator/types/page-object-model-generator';
import { MockRequestGenerator } from './generator/types/mock-request-generator';

// eslint-disable-next-line prefer-const
export let args: FrameworkArguments = new FrameworkArguments();

const FrameworkContainer = new Container();

FrameworkContainer.bind(FrameworkFunctionality.MochaSources)
    .toDynamicValue(() => {
        return Configuration.application.frameworkConfig.sources
            .filter(itm => itm.type == SourcesType.api)[0]?.locations ?? [];
    });

FrameworkContainer.bind<string>(FrameworkFunctionality.MochaReportType)
    .toDynamicValue(() => {
        return Configuration.application.frameworkConfig.mochaReporters;
    });

FrameworkContainer.bind<MochaReporterParams>(FrameworkFunctionality.MochaReportOptions)
    .toDynamicValue(() => {
        return args.saveReport
            ? { output: TestRunner.getReportFileName(SourcesType.api, Configuration.application.frameworkConfig.mochaReporters) }
            : null;
    });

FrameworkContainer.bind<MochaCompiler>(FrameworkFunctionality.MochaApi)
    .to(MochaVanillaCompiler)
    .whenTargetTagged(FrameworkTags.useGherkin, false);

FrameworkContainer.bind<MochaCompiler>(FrameworkFunctionality.MochaApi)
    .to(MochaBddCompiler)
    .whenTargetTagged(FrameworkTags.useGherkin, true);

FrameworkContainer.bind<IGenerator>(FrameworkFunctionality.Generator)
    .to(ProductGenerator)
    .whenTargetTagged(FrameworkTags.generatorType, GenerateableTypes.Product.toString());

FrameworkContainer.bind<IGenerator>(FrameworkFunctionality.Generator)
    .to(StepDefinitionsGenerator)
    .whenTargetTagged(FrameworkTags.generatorType, 'StepDefinitions');

FrameworkContainer.bind<IGenerator>(FrameworkFunctionality.Generator)
    .to(TestAreaGenerator)
    .whenTargetTagged(FrameworkTags.generatorType, 'TestArea');

FrameworkContainer.bind<IGenerator>(FrameworkFunctionality.Generator)
    .to(VariantGenerator)
    .whenTargetTagged(FrameworkTags.generatorType, 'Variant');

FrameworkContainer.bind<IGenerator>(FrameworkFunctionality.Generator)
    .to(LogicModelGenerator)
    .whenTargetTagged(FrameworkTags.generatorType, 'LogicModel');

FrameworkContainer.bind<IGenerator>(FrameworkFunctionality.Generator)
    .to(EnvironmentGenerator)
    .whenTargetTagged(FrameworkTags.generatorType, 'Environment');

FrameworkContainer.bind<IGenerator>(FrameworkFunctionality.Generator)
    .to(FeatureGenerator)
    .whenTargetTagged(FrameworkTags.generatorType, 'FeatureFile');

FrameworkContainer.bind<IGenerator>(FrameworkFunctionality.Generator)
    .to(PageObjectModelGenerator)
    .whenTargetTagged(FrameworkTags.generatorType, 'PageObjectModel');

FrameworkContainer.bind<IGenerator>(FrameworkFunctionality.Generator)
    .to(MockRequestGenerator)
    .whenTargetTagged(FrameworkTags.generatorType, 'MockRequest');

export { FrameworkContainer };