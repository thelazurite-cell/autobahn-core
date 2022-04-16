import {
  $,
  Locator,
} from '../../../../../../../dist/framework/driver/locators/locator';
import { LocatorType } from '../../../../../../../dist/framework/driver/locators/locator-type';
import { PageObjectModel } from '../../../../../../../dist/framework/driver/page-object-model';

// Running outside the source of this repo, you should use the project's imports: 
//
// import {
//   $,
//   Locator,
// } from 'autobahn-core/dist/framework/driver/locators/locator';
// import { LocatorType } from 'autobahn-core/dist/framework/driver/locators/locator-type';
// import { PageObjectModel } from 'autobahn-core/dist/framework/driver/page-object-model';

export class Results extends PageObjectModel {
  public modelLocation = '?q=';
  public headerLogo: Locator = $(
    '.header__logo-wrap',
    LocatorType.Css
  );

  public searchdropdown: Locator = $('search_dropdown', LocatorType.Id);

  public searchforminput: Locator = $('search_form_input', LocatorType.Id);
  public searchforminputclear: Locator = $(
    'search_form_input_clear',
    LocatorType.Id
  );
  public searchbutton: Locator = $('search_button', LocatorType.Id);

  public searchResultTitles: Locator = $('.js-result-title-link', LocatorType.AllCss);
}
