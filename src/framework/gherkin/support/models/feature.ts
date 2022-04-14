import { messages } from '@cucumber/messages';

export class Feature {
    featureTitle: string;
    featureSteps: messages.Pickle.IPickleStep[] = [];
    missingFeatureSteps: string[] = [];
    fileName: string;
}
