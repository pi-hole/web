<?php

class UserAuthStatus {

    public $authenticated;
    public $wrongPassword;
    public $ldapAuth;

    public function __construct($authenticated, $wrongPassword, $ldapAuth) {
        $this->authenticated = $authenticated;
        $this->wrongPassword = $wrongPassword;
        $this->ldapAuth = $ldapAuth;
    }

}
