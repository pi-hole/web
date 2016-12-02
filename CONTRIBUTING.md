## Pull Request Process

This is a basic checklist for now, We will update it in the future.

* Fork the repo and create your new branch based on the `devel` (development) branch.
* Use 4 spaces instead of tabs
* Commit Unix line endings
* If you want, try to keep to the theme of black holes/gravity. This can add some fun to your submission.
* Submit Pull Requests to the development branch only.
* Before Submitting your Pull Request, merge `devel` with your new branch and fix any conflicts. (Make sure you don't break anything in development!)
* Be patient. We will review all submitted pull requests, but our focus is on stability.. please don't be offended if we reject your PR, or it appears we're doing nothing with it! We'll get around to it..

## Stubbing

You can start AdminLTE using stubbed information in order to help ease the development process on machines where Pi-hole is not installed.

To activate stubbed data, modify system.php and set ENABLE_STUBS to true. **Make sure you set it back to false before commiting.**
```php
$ENABLE_STUBS = true;
```

When writing new code that uses something on the file system or a pi-hole command, assume that it is not available on the machine, wrap it in a stubbable function in system.php instead, and write some default return value to use.