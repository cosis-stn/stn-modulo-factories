'use strict';
/*global URL_SISTEMA */
angular.module('stn.modulo-factories',[])

  .factory('LoginSvc', function($resource){ 
	return $resource(URL_SISTEMA +'/rest/Usuario');
	})  
	.factory('logoutSvc', function($resource){ //servico para logout
		return $resource(URL_SISTEMA +'/rest/Usuario/Sair'  );
	})
	.factory('authFactory', function(metaFactory,$route){
		var objAuth = {};
		var permissoesTela = [];
		
		objAuth.ajustarPagina = function(escopo){
			
			escopo.matrixPermissoes = [];
		
			metaFactory['restPermissaoPerfilPorUsuarioSvc'].query(function(data) {		
				
				angular.forEach(data, function(value) {
				
					if (value.nomeClasse == $route.current.$$route.classeImplementacao
						&& value.nomePerfil==localStorage.usuarioPerfil) {					
						permissoesTela[value.nomeMetodo] = value.ativo;
					}
				});
				
				
				escopo.matrixPermissoes = permissoesTela;			
	
			});
		};
		
		objAuth.prepararChecarAcessoLink = function (escopo) {
			var acessoLink = [];		
			var mostrarBuscaAvancada = false;
			metaFactory['restPermissaoPerfilPorUsuarioSvc'].query(
				function(data) {
					angular.forEach($route.routes,function(valueRota) {					
						angular.forEach(data,function(valuePerm){
							if (valuePerm.nomeAmigavel == "Busca Avançada")
								mostrarBuscaAvancada = valuePerm.ativo;
								
							if (valuePerm.nomeClasse == valueRota.classeImplementacao
								&& valuePerm.nomePerfil == localStorage.usuarioPerfil
								&& valuePerm.ativo == true) {
								acessoLink[valueRota.originalPath]=true;
							}
						});
					});
					//solução de contorno parao menu busca avançada não aparecer para quem não é autorizado
					acessoLink["/Chamado/buscaChamados"]=mostrarBuscaAvancada;
					escopo.acessoLink = acessoLink;
				}
			);
		}
		
		return objAuth;
	})
	.factory('crudService', function(metaFactory, ngDialog, toastr,  $rootScope, ajudaSvc, $location,utilsSvc) {
		var _obj = {};
		var templateDetalhar;
		var _scope;
		
		_obj.prepararCrudService = function(escopo) {
			_scope = escopo;
			_scope.modalCriar = function(){_obj.modalCriar()}; 
			_scope.modalAtualizar = function(id) {_obj.modalAtualizar(id)};
			_scope.modalConfirmarRemover = function(id) {_obj.modalConfirmarRemover(id)};
			_scope.criar = function() {_obj.criar()};
			_scope.lerUm = function(id) {_obj.lerUm(id)};
			_scope.lerTodos = function(){_obj.lerTodos()};
			_scope.atualizar = function() {_obj.atualizar()};
			_scope.remover = function(id) {_obj.remover(id)};
			_scope.salvar = function() {_obj.salvar()};
			
			// Array de linhas selecionadas. usado para as teclas de atalho.
			_scope.linhasSelecionadas = [];
			
			
		}
		
		// Abre a modal para criar novo item.
		_obj.modalCriar = function(large) {
			_scope.obj = {};
			ajudaSvc.templateModal = _obj.templateInserir;
			
			if (large !== undefined) {
				ngDialog.open({
					template: _obj.templateInserir,
					scope: _scope,
					className: 'ngdialog-theme-default ngdialog-large'
				});
			} else {
				ngDialog.open({
					template: _obj.templateInserir,
					scope: _scope
				});
			}
		};
		
		// Abre modal para atualizar item existente.
		_obj.modalAtualizar = function(id, large) {
			metaFactory[_obj.factory].get({ id: id }, function(dataModalEditar) {
				_scope.obj = dataModalEditar;
				
				//função que permite a execução de métodos após o carregamento da modal
				try{
					_scope.postModalEditar();
				} catch(err) {				
				}
				
				ajudaSvc.templateModal = _obj.templateEditar;
				if (large !== undefined) {
					ngDialog.open({
						template: _obj.templateEditar,
						scope: _scope,
						className: 'ngdialog-theme-default ngdialog-large'
					});
				} else {
					ngDialog.open({
						template: _obj.templateEditar,
						scope: _scope
					});
				}
			}, function() {
				toastr.error('Erro ao buscar objeto.');
			});
		};
	
		// Abre a modal de remoção de item.
		_obj.modalConfirmarRemover = function(id) {
			ngDialog.openConfirm({
				template: '<legend class=topo-modal>Confirmar exclusão</legend>\t\t\t\t<p>Tem certeza que deseja remover esse item?</p>\t\t\t\t<div class="ngdialog-buttons">\t\t\t\t\t<button type="button" class="ngdialog-button btn-primary" ng-click="closeThisDialog(0)">N\xE3o</button>\t\t\t\t\t<button type="button" class="ngdialog-button  btn-danger" auto-focus=true ng-click="confirm(1)">Sim</button>\t\t\t\t</div>',
				plain: true
			}).then(function() {
				_scope.remover(id);
			}, function() {
				toastr.info('Item n\xE3o removido.');
			});
		};
		
		// Insere um novo item.
		_obj.criar = function() {
			metaFactory[_obj.factory].save(_scope.obj, function(data) {			
				utilsSvc.tratarResposta(data);			
				ngDialog.closeAll();
				_scope.lerTodos();
				
	
			}, function(data){utilsSvc.tratarErro(data)})
			
		};
		
		_obj.lerUm = function(obj, large) {
			metaFactory[_obj.factory].get({id: obj.id}, function(data) {
				_scope.obj = data;
				ajudaSvc.templateModal = _obj.templateDetalhar;
				
				//efetua a leitura do registro de auditoria
				metaFactory[_obj.factory+'Auditoria'].get({id: obj.id}, function(dataAuditoria) {				
					_scope.obj.logAuditoria = dataAuditoria;
				
					if (large !== undefined) {
						ngDialog.open({
							template: _obj.templateDetalhar,
							scope: _scope,
							closeByEscape: false,
							className: 'ngdialog-theme-default ngdialog-large'
						});
					} else {
						ngDialog.open({
							template: _obj.templateDetalhar,
							scope: _scope
						});
					}
				});
			}, function() {
				toastr.error('Erro ao buscar dados.');
			});
		};
	
		_obj.lerTodos = function() {
			var ordenacao = '';
			if (_obj.ordenado==true){
				ordenacao='Ordenado';
			}
			metaFactory[_obj.factory+ordenacao].query(function(data) {
				_scope.dadosGrid = data;
				if (data.length === 0) {
					toastr.info('N\xE3o h\xE1 registros cadastrados.');
					$('dadosGrid').hide();
				} else {
					$('dadosGrid').show();
				}
			}, function() {
				toastr.error('erro ao buscar registros.');
			});
		};
	
		_obj.atualizar = function() {
			metaFactory[_obj.factory].update(_scope.obj, function() {
				toastr.success('Registro atualizado com sucesso.');
				ngDialog.closeAll();
				_scope.lerTodos();
				
				// Mudando o location no caso do serviço, já que não tem modal.
				if (_obj.factory === 'restServicoSvc'){
					$location.path('/Servico/');
				}
			}, function(data){utilsSvc.tratarErro(data)});
		};
		
		_obj.remover = function(id) {
			_scope.obj.id = id;
			
			metaFactory[_obj.factory].remove(_scope.obj, function() {
				toastr.success('Registro removido com sucesso.');
				_scope.lerTodos();
			},function(data){ utilsSvc.tratarErro(data)}
			
			);
		};
		
		_obj.salvar = function() {
			if (isNaN(_scope.obj.id) || _scope.obj.id === '') {
				_scope.criar();
			} else {
				_scope.atualizar();
			}
		};
		
		return _obj;
	})