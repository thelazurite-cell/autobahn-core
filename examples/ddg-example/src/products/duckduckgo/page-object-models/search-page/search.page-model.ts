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

export class Search extends PageObjectModel {
  public modelLocation = '/';

  public faqBtn0: Locator = $('faq-btn-0', LocatorType.Id);
  public faqBtn1: Locator = $('faq-btn-1', LocatorType.Id);
  public faqBtn2: Locator = $('faq-btn-2', LocatorType.Id);
  public faqBtn3: Locator = $('faq-btn-3', LocatorType.Id);
  public faqBtn4: Locator = $('faq-btn-4', LocatorType.Id);
  public faqBtn5: Locator = $('faq-btn-5', LocatorType.Id);
  public faqBtn6: Locator = $('faq-btn-6', LocatorType.Id);
  public faqBtn7: Locator = $('faq-btn-7', LocatorType.Id);
  public faqBtn8: Locator = $('faq-btn-8', LocatorType.Id);


  public searchforminputhomepage: Locator = $(
    'search_form_input_homepage',
    LocatorType.Id
  );
  public searchbuttonhomepage: Locator = $(
    'search_button_homepage',
    LocatorType.Id
  );
  public searchforminputclear: Locator = $(
    'search_form_input_clear',
    LocatorType.Id
  );

}
