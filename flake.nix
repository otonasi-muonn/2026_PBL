{
  description = "Web development environment (npm + Hono + React + Vite + Bun)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
  };

  outputs =
    { self, nixpkgs }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      forAllSystems = f: nixpkgs.lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});

      # nixpkgs の bun が古いため、GitHub Releases の公式バイナリで上書き
      bunVersion = "1.4.4";
      bunHashes = {
        "aarch64-darwin" = {
          asset = "bun-darwin-aarch64";
          hash = "sha256-wkDX8My5DCY6hJ/NsJt+5iYw2SE0jtaq/ahrnVd7xRA=";
        };
        "aarch64-linux" = {
          asset = "bun-linux-aarch64";
          hash = "sha256-uqa7NvUdblhWHgK76oJQOKnfRU9nPW13bou/hvjHhQ4=";
        };
        "x86_64-darwin" = {
          asset = "bun-darwin-x64-baseline";
          hash = "sha256-1KFVrfv9CRVes7oFyeOlRPOSl9emhhbTx3WfZ6tcR9w=";
        };
        "x86_64-linux" = {
          asset = "bun-linux-x64";
          hash = "sha256-v4zL+ysLgBWeD5ptFcVTF63YB3U028YTCj7bUvzLOVw=";
        };
      };
      mkBun =
        pkgs:
        let
          src = bunHashes.${pkgs.stdenv.hostPlatform.system};
        in
        pkgs.bun.overrideAttrs (_: {
          version = bunVersion;
          src = pkgs.fetchurl {
            url = "https://github.com/oven-sh/bun/releases/download/bun-v${bunVersion}/${src.asset}.zip";
            inherit (src) hash;
          };
        });
    in
    {
      devShells = forAllSystems (pkgs: {
        default = pkgs.mkShell {
          packages = [
            pkgs.nodejs_24
            (mkBun pkgs)
          ];

          shellHook = ''
            export PATH="$PWD/node_modules/.bin:$PATH"
            echo "node $(node --version) / npm v$(npm --version) / bun v$(bun --version)"
          '';
        };
      });

      formatter = forAllSystems (pkgs: pkgs.nixfmt);
    };
}
