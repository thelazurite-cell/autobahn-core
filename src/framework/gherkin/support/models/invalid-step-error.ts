import { messages } from '@cucumber/messages';
import StepDefinition from '@cucumber/cucumber/lib/models/step_definition';

export class InvalidStepError extends Error {
    stepDefinition: StepDefinition;
    step: messages.Pickle.PickleStep | string;
}
