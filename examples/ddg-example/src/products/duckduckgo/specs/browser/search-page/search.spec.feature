Feature: DDG Landing Page

    As A user of duckduck go
    I want to search for results
    So that I can find something that I'm looking for

    Background:
        Given I am on the homepage

    Scenario: Typing example into the search page
        Given I have entered 'example.com' as the search term
        When I am on the results page
        Then I should see a result with a title of 'Example Domain'