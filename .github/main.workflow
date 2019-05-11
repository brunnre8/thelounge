workflow "New workflow" {
  resolves = ["Test"]
  on = "push"
}

action "Install" {
  uses = "Borales/actions-yarn@master"
  args = "install --frozen-lockfile --non-interactive"
}

action "Build" {
  uses = "Borales/actions-yarn@master"
  needs = ["Install"]
  args = "build"
}

action "Test" {
  uses = "Borales/actions-yarn@master"
  needs = ["Build"]
  args = "test"
}
