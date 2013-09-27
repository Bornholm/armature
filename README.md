# Armature

Module d'aide à la création d'application

## Fonctionnalités

- Architecture de plugins basée sur les modules NPM
- Système d'interdépendance des plugins basé sur [Semver](https://github.com/mojombo/semver/blob/master/semver.md)
- Séquences d'initialisation & de fermeture de l'application avec étapes asynchrones

# Documentation

- [App](#armatureapp)
- [Error](#armatureerror)
- [DependencyGraph](#armaturedependencygraph)
- [Plugins](#plugins)

## Armature.App

### app.name

Utilisé par le système de plugins pour identifier la section des dépendances dans le fichier _package.json_.
Ainsi, si la propriété _name_ de l'application a la valeur "foo", l'application va utiliser la section
"fooPlugin" dans le fichier _package.json_ des plugins pour calculer leurs dépendances.

**Exemple:**
```

// Application
var FooApp = function() {
  this.name = 'foo';
}

// Fichier package.json d'un plugin
{
  "name": "fooFirstPlugin",
  "version": "v0.0.0",
  "fooPlugin": {
    "fooSecondPlugin": "v0.0.1"
  }
}

// Le plugin fooFirstPlugin a une dépendance vers le plugin fooSecondPlugin en version v.0.0.1.
```

### app.initialize( _cb_ )

Exécute séquentiellement toutes les étapes d'initialisation enregistrées dans l'application.

#### Paramètres

- **cb(err)**  _Function_  Appelée après l'exécution de toutes les étapes d'initialisation.

### app.terminate( _cb_ )

Exécute séquentiellement toutes les étapes de fermeture enregistrées dans l'application.

#### Paramètres

- **cb(err)**  _Function_  Appelée après l'exécution de toutes les étapes de fermeture.

### app.terminate( _cb_ )

Exécute séquentiellement toutes les étapes de fermeture enregistrées dans l'application.

#### Paramètres

- **cb(err)**  _Function_  Appelée après l'exécution de toutes les étapes de fermeture.

### app.addInitSteps( _step,..._ )

Ajoute des étapes à la phase d'initialisation de l'application.

#### Paramètres

- **steps,...**  _Function_  Fonctions asynchrones seront appelées séquentiellement.

**Exemple**
```

var dbStep = function(next) {
  // this == app
  this.database.findAll(function(err, records) {
    if(err) {
      return next(err);
    } else {
      // Travailler avec les records
      return next();
    }
  }); 
};

var fooStep = function(next) {
  console.log('foo !');
  return process.nextTick(next);
};

app.addInitSteps(fooStep, dbStep);

app.initialize(function(err) {
    if(err) {
      // Quelque chose ne s'est pas déroulé correctement dans la phase d'initialisation
    } else {
      // All good !
    }
});

```

### app.addTermSteps( _step,..._ )

Ajoute des étapes à la phase de fermeture de l'application.

#### Paramètres

- **steps,...**  _Function_  Fonctions asynchrones seront appelées séquentiellement.

Même fonctionnement que _addInitSteps()_.

### app.registerPlugin( _pluginPath_, _pluginOpts_ )

Enregistre un nouveau plugin dans l'application.

#### Paramètres

- **pluginPath**  _String_  Chemin d'accès au dossier de plugin. Le plugin sera chargé via la méthode _require()_.
- **pluginOpts**  _Object_  Options à passer au plugin lors de son initialisation.


### app.loadPlugins( _cb_ )

Initialise l'ensemble des plugins chargés dans l'application, dans l'ordre des dépendances de ceux ci.
La méthode loadPlugins est pensée pour s'intégrer dans la séquence d'initialisation de l'application (voir _addInitStep()_);

Voir la section **Plugins**

#### Paramètres

- **cb(err)**  _Function_  Appelée après l'initialisation de tous les plugins.

## Armature.Error

Classe utilitaire de personnalisation des erreurs. 
Capture la pile d'appels au moment de l'instanciation.

### Utilisation
```
var ArmatureError = require('armature').Error;

// Usage: new ArmatureError(opts)

var err = new ArmatureError({
  name: 'MyError',
  message: 'This is my error. There are many like it, but this one is mine.',
  status: 500 // Propriété personnalisée
});

console.log(err.status) // -> 500;
```

## Armature.DependencyGraph

Classe de calcul des dépendances entre les plugins.


## Plugins

Un plugin Armature prend simplement la forme d'un module NPM avec un fichier _package.json_.

### Module

Le module sera chargé via la méthode _require()_.

```
// index.js
module.exports = {
  
  load: function(opts) {
    // Chargement du plugin
  },

  unload: function(opts) {
    // Déchargement du plugin
  }

}
```
Les méthodes exposées par le plugin _load_ et _unload_ seront exécutées par l'application pendant les phases d'initialisation et de fermeture de l'application (voir méthodes _initialize()_ et _terminate()_ de App).

Le paramètre _opts_ correspond aux options passées en second paramètre de la méthode _registerPlugin()_.

Voir les exemples pour plus d'informations.






