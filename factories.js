'use strict';
/*global URL_SISTEMA */
angular.module('stn.modulo-factories',[])

  .factory('LoginSvc', function($resource){ 
	return $resource(URL_SISTEMA +'/rest/Usuario');
	})  
	.factory('logoutSvc', function($resource){ //servico para logout
		return $resource(URL_SISTEMA +'/rest/Usuario/Sair'  );
	})
	