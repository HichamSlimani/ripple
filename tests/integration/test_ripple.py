from gltest import get_contract_factory
from gltest.assertions import tx_execution_succeeded

DOMAINS = {
    "ECONOMY",
    "SOCIETY",
    "TECHNOLOGY",
    "ENVIRONMENT",
    "POLITICS",
    "CULTURE",
    "HEALTH",
    "SECURITY",
}


def test_ripple_consensus():
    factory = get_contract_factory("Ripple")
    contract = factory.deploy(args=[])  # deployer becomes owner

    # Pose a credible what-if premise (deterministic write, no LLM yet).
    premise = (
        "A nation suddenly bans all private cars in its largest city overnight, "
        "with no replacement transit announced."
    )
    rc_pose = contract.pose(args=[premise]).transact()
    assert tx_execution_succeeded(rc_pose)

    premises = contract.get_premises(args=[0]).call()
    assert len(premises) == 1
    pid = premises[0]["id"]
    assert pid == "premise-0"
    assert premises[0]["status"] == "OPEN"
    assert int(premises[0]["instability"]) == 0
    assert premises[0]["consequences"] == []

    # The AI consensus write: the Futurist projects the cascade.
    rc_ripple = contract.ripple(args=[pid]).transact()
    assert tx_execution_succeeded(rc_ripple)

    record = contract.get_premise(args=[pid]).call()
    assert record["status"] == "PROJECTED"

    instability = int(record["instability"])
    assert 0 <= instability <= 100

    consequences = record["consequences"]
    assert 3 <= len(consequences) <= 5
    for c in consequences:
        assert c["domain"] in DOMAINS
        assert 0 < len(c["effect"]) <= 200
        assert isinstance(c["sub"], list)
        assert len(c["sub"]) <= 2
        for s in c["sub"]:
            assert 0 < len(s) <= 160

    stats = contract.get_stats(args=[]).call()
    assert int(stats["premises"]) == 1
    assert int(stats["projected"]) == 1
