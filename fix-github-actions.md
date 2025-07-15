# Correction GitHub Actions - Docker Build

## Problème
```
ERROR: failed to build: Cache export is not supported for the docker driver.
```

## Solution Appliquée

Le problème vient du fait que GitHub Actions utilise le driver Docker par défaut qui ne supporte pas l'export de cache.

### Correction dans `.github/workflows/docker-build.yml` :

**Ajouté :**
```yaml
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3
```

Cette étape configure Docker Buildx avec un driver qui supporte les options de cache avancées.

## Alternative Simple (si le problème persiste)

Si vous voulez une solution rapide sans cache :

```yaml
- name: Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: ${{ steps.meta.outputs.tags }}
    labels: ${{ steps.meta.outputs.labels }}
    # Supprimé : cache-from et cache-to
```

## Résultat

Maintenant GitHub Actions pourra :
- ✅ Builder l'image Docker sans erreur
- ✅ Utiliser le cache pour des builds plus rapides
- ✅ Publier l'image sur GitHub Container Registry

## Test

Pour tester, poussez un commit et vérifiez que le workflow fonctionne dans l'onglet "Actions" de votre repository GitHub.