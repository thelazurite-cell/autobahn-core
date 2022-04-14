/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { Container, interfaces } from 'inversify';
import { args } from '../framework.config';

export type IdentifierType = string | number | symbol;

export function getTaggedOrDefault<T>(container: Container, sid: IdentifierType): T {
    const metadataKey = Symbol.for('product');
    const metadataValue = args.product;
    const metadataFallbackValue = args.product.split('.')[0];

    try {
        return getType(container, sid, metadataKey, metadataValue);
    } catch {
        return getType(container, sid, metadataKey, metadataFallbackValue);
    }
}

export function getType<T>(container: Container, sid: IdentifierType, metadataKey: IdentifierType, metadataValue: string) {
    const variant = container?.getAllTagged(<interfaces.ServiceIdentifier<unknown>>sid, metadataKey, metadataValue) || [];
    if (variant.length !== 0) {
        return <T><unknown>variant[0];
    }

    throw Error('No matching type');
}